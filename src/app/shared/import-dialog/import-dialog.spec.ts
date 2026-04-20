import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ImportDialog } from './import-dialog';
import { TranslateService } from '../../services/translate.service';
import { UserService } from '../../services/user.service';
import { Permission, User, UserRole } from '../../models/user.model';

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
          useValue: { translate: (key: string) => key, version: signal('en'), currentLang: signal('en') },
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

  it('cancel() closes the dialog with no value', () => {
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});
