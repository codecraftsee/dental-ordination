import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { DocumentPreviewFullscreen } from './document-preview-fullscreen';
import { PatientDocument } from '../../../models/patient-document.model';

function makeDoc(overrides: Partial<PatientDocument> = {}): PatientDocument {
  return {
    id: 'd-1',
    patientId: 'p-1',
    filename: 'xray.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1000,
    uploadedAt: '2026-04-22T10:00:00Z',
    signedUrl: 'https://storage.example/xray.pdf',
    ...overrides,
  };
}

describe('DocumentPreviewFullscreen', () => {
  let closeFn: ReturnType<typeof vi.fn>;

  function createComponent(doc: PatientDocument): DocumentPreviewFullscreen {
    closeFn = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: closeFn } },
        { provide: MAT_DIALOG_DATA, useValue: { doc } },
      ],
    });
    return TestBed.createComponent(DocumentPreviewFullscreen).componentInstance;
  }

  it('detects image MIME types', () => {
    const c = createComponent(makeDoc({ contentType: 'image/png' }));
    expect(c.isImage).toBe(true);
    expect(c.isPdf).toBe(false);
  });

  it('detects PDF MIME type', () => {
    const c = createComponent(makeDoc({ contentType: 'application/pdf' }));
    expect(c.isPdf).toBe(true);
    expect(c.isImage).toBe(false);
  });

  it('produces a SafeResourceUrl from the signed URL', () => {
    const c = createComponent(makeDoc());
    expect(c.safeUrl).toBeDefined();
  });

  it('close() calls dialogRef.close', () => {
    const c = createComponent(makeDoc());
    c.close();
    expect(closeFn).toHaveBeenCalled();
  });
});
