import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { PatientDocuments } from './patient-documents';
import { DocumentPreviewFullscreen } from './document-preview-fullscreen/document-preview-fullscreen';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { PatientDocumentService } from '../../services/patient-document.service';
import { PatientDocument } from '../../models/patient-document.model';

const doc: PatientDocument = {
  id: 'd-1',
  patientId: 'p-1',
  filename: 'xray.pdf',
  contentType: 'application/pdf',
  sizeBytes: 2_400_000,
  uploadedAt: '2026-04-22T10:00:00Z',
  signedUrl: 'https://storage.example/xray.pdf',
};

describe('PatientDocuments', () => {
  let component: PatientDocuments;
  let toastError: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let confirmFn: ReturnType<typeof vi.fn>;
  let docService: PatientDocumentService;

  beforeEach(() => {
    toastError = vi.fn();
    toastSuccess = vi.fn();
    confirmFn = vi.fn().mockReturnValue(of(true));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ToastService, useValue: { success: toastSuccess, error: toastError } },
        { provide: ConfirmDialogService, useValue: { confirm: confirmFn } },
      ],
    });

    const fixture = TestBed.createComponent(PatientDocuments);
    fixture.componentRef.setInput('patientId', 'p-1');
    component = fixture.componentInstance;
    docService = TestBed.inject(PatientDocumentService);
  });

  it('formatBytes produces human-readable sizes', () => {
    expect(component.formatBytes(0)).toBe('0 B');
    expect(component.formatBytes(1024)).toBe('1.0 KB');
    expect(component.formatBytes(2_400_000)).toBe('2.3 MB');
  });

  it('typeLabel maps known MIME types to short labels', () => {
    expect(component.typeLabel('application/pdf')).toBe('PDF');
    expect(component.typeLabel('image/jpeg')).toBe('JPG');
    expect(component.typeLabel('image/png')).toBe('PNG');
    expect(component.typeLabel('image/webp')).toBe('WEBP');
  });

  it('isImage detects image MIME types', () => {
    expect(component.isImage('image/jpeg')).toBe(true);
    expect(component.isImage('application/pdf')).toBe(false);
  });

  it('upload rejects unsupported MIME types and toasts an error', () => {
    const uploadSpy = vi.spyOn(docService, 'upload');
    const file = new File(['x'], 'note.txt', { type: 'text/plain' });
    component.pendingFile.set(file);
    component.upload();
    expect(toastError).toHaveBeenCalledWith('patient.documents.invalidType');
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it('upload rejects oversized files and toasts an error', () => {
    const uploadSpy = vi.spyOn(docService, 'upload');
    const file = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 26 * 1024 * 1024 });
    component.pendingFile.set(file);
    component.upload();
    expect(toastError).toHaveBeenCalledWith('patient.documents.tooLarge');
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it('upload calls service with file + description when valid', () => {
    const uploadSpy = vi.spyOn(docService, 'upload').mockReturnValue(of(doc));
    const file = new File(['x'], 'good.pdf', { type: 'application/pdf' });
    component.pendingFile.set(file);
    component.description.set('checkup notes');
    component.upload();
    expect(uploadSpy).toHaveBeenCalledWith('p-1', file, 'checkup notes');
    expect(toastSuccess).toHaveBeenCalledWith('patient.documents.uploadSuccess');
    expect(component.pendingFile()).toBeUndefined();
    expect(component.description()).toBe('');
    expect(component.selectedDocument()).toEqual(doc);
  });

  it('selectDocument updates the selected signal', () => {
    component.selectDocument(doc);
    expect(component.selectedDocument()).toEqual(doc);
  });

  it('deleteDocument confirms, then deletes and clears selection if selected', () => {
    const deleteSpy = vi.spyOn(docService, 'delete').mockReturnValue(of(undefined));
    component.selectedDocument.set(doc);
    component.deleteDocument(doc);
    expect(confirmFn).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith('p-1', 'd-1');
    expect(component.selectedDocument()).toBeUndefined();
    expect(toastSuccess).toHaveBeenCalledWith('patient.documents.deleteSuccess');
  });

  it('deleteDocument does nothing when the user cancels the confirmation', () => {
    confirmFn.mockReturnValueOnce(of(false));
    const deleteSpy = vi.spyOn(docService, 'delete');
    component.deleteDocument(doc);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('openPreview opens the fullscreen dialog with the document as data', () => {
    const dialog = TestBed.inject(MatDialog);
    const openSpy = vi.spyOn(dialog, 'open');
    component.openPreview(doc);
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [dialogComponent, config] = openSpy.mock.calls[0];
    expect(dialogComponent).toBe(DocumentPreviewFullscreen);
    expect(config?.data).toEqual({ doc });
    expect(config?.panelClass).toBe('fullscreen-preview-dialog');
  });
});
