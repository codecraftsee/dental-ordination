import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/translate.pipe';
import { PatientDocument } from '../../../models/patient-document.model';

export interface DocumentPreviewData {
  doc: PatientDocument;
}

@Component({
  selector: 'app-document-preview-fullscreen',
  imports: [TranslatePipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './document-preview-fullscreen.html',
  styleUrl: './document-preview-fullscreen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewFullscreen {
  private dialogRef = inject(MatDialogRef<DocumentPreviewFullscreen>);
  private data = inject<DocumentPreviewData>(MAT_DIALOG_DATA);

  readonly doc = this.data.doc;
  readonly isImage = this.doc.contentType.startsWith('image/');
  readonly isPdf = this.doc.contentType === 'application/pdf';
  readonly safeUrl: SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    this.doc.signedUrl,
  );

  close(): void {
    this.dialogRef.close();
  }
}
