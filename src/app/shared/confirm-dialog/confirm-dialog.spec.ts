import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';
import { TranslateService } from '../../services/translate.service';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const mockData: ConfirmDialogData = {
    title: 'Delete Item',
    message: 'Are you sure?',
  };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        provideAnimations(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        {
          provide: TranslateService,
          useValue: { translate: (key: string) => key, version: signal('en'), currentLang: signal('en') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title from dialog data', () => {
    const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title.textContent).toContain(mockData.title);
  });

  it('renders the message from dialog data', () => {
    const content = fixture.nativeElement.querySelector('mat-dialog-content p');
    expect(content.textContent).toContain(mockData.message);
  });

  it('confirm() closes the dialog with true', () => {
    component.confirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('cancel() closes the dialog with no value', () => {
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('clicking the Yes button closes the dialog with true', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const yesButton = Array.from(buttons).find((btn: Element) =>
      (btn as HTMLElement).textContent?.includes('common.yes'),
    ) as HTMLElement;
    yesButton.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('clicking the No button closes the dialog with no value', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const noButton = Array.from(buttons).find((btn: Element) =>
      (btn as HTMLElement).textContent?.includes('common.no'),
    ) as HTMLElement;
    noButton.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});
