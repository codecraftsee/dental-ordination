import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ImportDialog } from './import-dialog';
import { TranslateService } from '../../services/translate.service';
import { UserService } from '../../services/user.service';
import { User, UserRole } from '../../models/user.model';

const MB = 1024 * 1024;

/** A File of a given size without allocating the bytes. */
function fileOf(name: string, size: number): File {
  const file = new File(['x'], name);
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/** jsdom has no usable FileList, so the handlers get a shaped stand-in. */
function changeEvent(files: File[]): Event {
  const input = { files, value: 'C:\\fakepath\\picked.xlsx' } as unknown as HTMLInputElement;
  return { target: input } as unknown as Event;
}

function dropEvent(files: File[]): DragEvent {
  return {
    preventDefault: () => undefined,
    dataTransfer: { files },
  } as unknown as DragEvent;
}

describe('ImportDialog', () => {
  let component: ImportDialog;
  let fixture: ComponentFixture<ImportDialog>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const mockDoctors: User[] = [
    {
      id: 'doc-1',
      email: 'a@x.com',
      firstName: 'Ana',
      lastName: 'Jovanovic',
      role: UserRole.Doctor,
      isActive: true,
      mustSetPassword: false,
      permissions: [],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'doc-2',
      email: 'b@x.com',
      firstName: 'Marko',
      lastName: 'Petrovic',
      role: UserRole.Doctor,
      isActive: true,
      mustSetPassword: false,
      permissions: [],
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ImportDialog],
      providers: [
        provideAnimations(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: UserService,
          useValue: {
            getByRole: (role: UserRole) => (role === UserRole.Doctor ? mockDoctors : []),
            getDisplayName: (id: string) => {
              const d = mockDoctors.find(u => u.id === id);
              return d ? `Dr. ${d.firstName} ${d.lastName}` : '';
            },
          },
        },
        {
          provide: TranslateService,
          useValue: {
            translate: (key: string) => key,
            format: (key: string, params: Record<string, string | number>) =>
              `${key}:${JSON.stringify(params)}`,
            version: signal('en'),
            currentLang: signal('en'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('starts on step 1', () => {
    expect(component.step()).toBe(1);
  });

  it('lists available doctors from UserService', () => {
    expect(component.doctors()).toHaveLength(2);
    expect(component.doctors()[0].id).toBe('doc-1');
  });

  it('defaults doctor selection to empty (auto-assign)', () => {
    expect(component.selectedDoctorId()).toBe('');
    expect(component.selectedDoctorName()).toBe('');
  });

  it('resolves display name when a doctor is selected', () => {
    component.selectedDoctorId.set('doc-2');
    expect(component.selectedDoctorName()).toBe('Dr. Marko Petrovic');
  });

  it('nextStep() advances to step 2', () => {
    component.nextStep();
    expect(component.step()).toBe(2);
  });

  it('prevStep() goes back to step 1', () => {
    component.nextStep();
    component.prevStep();
    expect(component.step()).toBe(1);
  });

  it('removeFile() removes the file at the given index', () => {
    const a = new File(['x'], 'a.xlsx');
    const b = new File(['y'], 'b.xlsx');
    component.selectedFiles.set([a, b]);
    component.removeFile(0);
    expect(component.selectedFiles()).toEqual([b]);
  });

  it('confirm() closes with auto-assign when no doctor selected', () => {
    const file = new File(['x'], 'test.xlsx');
    component.selectedFiles.set([file]);
    component.confirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ doctorId: undefined, files: [file] });
  });

  it('confirm() closes with the chosen doctorId when selected', () => {
    const file = new File(['x'], 'test.xlsx');
    component.selectedDoctorId.set('doc-1');
    component.selectedFiles.set([file]);
    component.confirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ doctorId: 'doc-1', files: [file] });
  });

  it('adds to the selection instead of replacing it', () => {
    component.onFilesSelected(changeEvent([fileOf('a.xlsx', MB)]));
    component.onFilesSelected(changeEvent([fileOf('b.xlsx', MB)]));
    expect(component.selectedFiles().map(f => f.name)).toEqual(['a.xlsx', 'b.xlsx']);
  });

  it('ignores a file already in the selection', () => {
    component.onFilesSelected(changeEvent([fileOf('a.xlsx', MB), fileOf('b.xlsx', MB)]));
    component.onFilesSelected(changeEvent([fileOf('b.xlsx', MB), fileOf('c.xlsx', MB)]));
    expect(component.selectedFiles().map(f => f.name)).toEqual(['a.xlsx', 'b.xlsx', 'c.xlsx']);
  });

  it('dedupes within a single pick as well', () => {
    component.onFilesSelected(changeEvent([fileOf('a.xlsx', MB), fileOf('a.xlsx', MB)]));
    expect(component.selectedFiles().map(f => f.name)).toEqual(['a.xlsx']);
  });

  it('clears the input so the same file can be picked again', () => {
    const event = changeEvent([fileOf('a.xlsx', MB)]);
    component.onFilesSelected(event);
    expect((event.target as HTMLInputElement).value).toBe('');
  });

  it('drop appends, and keeps only xlsx regardless of case', () => {
    component.selectedFiles.set([fileOf('a.xlsx', MB)]);
    component.onDrop(dropEvent([fileOf('b.XLSX', MB), fileOf('notes.pdf', MB)]));
    expect(component.selectedFiles().map(f => f.name)).toEqual(['a.xlsx', 'b.XLSX']);
  });

  it('a drop of nothing usable leaves the selection alone', () => {
    const existing = [fileOf('a.xlsx', MB)];
    component.selectedFiles.set(existing);
    component.onDrop(dropEvent([fileOf('notes.pdf', MB)]));
    expect(component.selectedFiles()).toBe(existing);
  });

  it('summarises the selection as files, size and upload count', () => {
    component.selectedFiles.set([fileOf('a.xlsx', 2 * MB), fileOf('b.xlsx', 3 * MB)]);
    expect(component.acceptedCount()).toBe(2);
    expect(component.totalSize()).toBe('5.0 MB');
    expect(component.batchCount()).toBe(1);
    expect(component.oversizedFiles()).toEqual([]);
  });

  it('reports more than one upload when the selection exceeds a request', () => {
    component.selectedFiles.set(Array.from({ length: 4 }, (_, i) => fileOf(`f${i}.xlsx`, 30 * MB)));
    expect(component.batchCount()).toBeGreaterThan(1);
  });

  it('flags a file too large to ever be sent and keeps it out of the import', () => {
    const good = fileOf('ok.xlsx', MB);
    const huge = fileOf('huge.xlsx', 200 * MB);
    component.selectedFiles.set([good, huge]);

    expect(component.isOversized(huge)).toBe(true);
    expect(component.isOversized(good)).toBe(false);
    expect(component.oversizedFiles()).toEqual([huge]);
    expect(component.acceptedCount()).toBe(1);

    // Still listed for the user to see, but never handed to the import.
    expect(component.selectedFiles()).toEqual([good, huge]);
    component.confirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ doctorId: undefined, files: [good] });
  });

  it('leaves nothing to import when every file is oversized', () => {
    component.selectedFiles.set([fileOf('huge.xlsx', 200 * MB)]);
    expect(component.acceptedCount()).toBe(0);
    expect(component.batchCount()).toBe(0);
  });

  it('cancel() closes the dialog with no value', () => {
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});
