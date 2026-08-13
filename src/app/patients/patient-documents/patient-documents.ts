import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DocumentPreviewFullscreen, DocumentPreviewData } from './document-preview-fullscreen/document-preview-fullscreen';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { HasPermissionPipe } from '../../shared/has-permission.pipe';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_SIZE_BYTES,
  PatientDocumentService,
} from '../../services/patient-document.service';

import { PatientDocument } from '../../models/patient-document.model';
import { Permission } from '../../models/user.model';

@Component({
  selector: 'app-patient-documents',
  imports: [FormsModule, TranslatePipe, LocalizedDatePipe, HasPermissionPipe, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule],
  templateUrl: './patient-documents.html',
  styleUrl: './patient-documents.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDocuments {
  readonly Permission = Permission;

  private documentService = inject(PatientDocumentService);
  private userService = inject(UserService);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  patientId = input.required<string>();

  selectedDocument = signal<PatientDocument | undefined>(undefined);
  pendingFile = signal<File | undefined>(undefined);
  description = signal('');
  dragging = signal(false);
  uploading = signal(false);

  docs = computed<PatientDocument[]>(() => this.documentService.getAll());

  displayedColumns = ['name', 'type', 'size', 'uploadedAt', 'actions'];
  dataSource = new MatTableDataSource<PatientDocument>();

  constructor() {
    effect(() => {
      const id = this.patientId();
      untracked(() => {
        this.selectedDocument.set(undefined);
        this.pendingFile.set(undefined);
        this.description.set('');
        this.documentService.loadByPatientId(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            error: err => this.toastService.error(err),
          });
      });
    });

    effect(() => {
      this.dataSource.data = this.docs();
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.acceptFile(input.files[0]);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
  }

  clearPendingFile(): void {
    this.pendingFile.set(undefined);
    this.description.set('');
  }

  upload(): void {
    const file = this.pendingFile();
    if (!file || this.uploading()) return;
    if (!this.validateFile(file)) return;

    this.uploading.set(true);
    const desc = this.description().trim();
    // No takeUntilDestroyed: this component is lazy mat-tab content and is destroyed
    // on every tab switch, which would abort the upload mid-body.
    this.documentService.upload(this.patientId(), file, desc || undefined)
      .subscribe({
        next: doc => {
          this.uploading.set(false);
          this.pendingFile.set(undefined);
          this.description.set('');
          this.selectedDocument.set(doc);
          this.toastService.success('patient.documents.uploadSuccess');
        },
        error: err => {
          this.uploading.set(false);
          this.toastService.error(err);
        },
      });
  }

  selectDocument(doc: PatientDocument): void {
    this.selectedDocument.set(doc);
  }

  openPreview(doc: PatientDocument): void {
    this.dialog.open<DocumentPreviewFullscreen, DocumentPreviewData>(DocumentPreviewFullscreen, {
      data: { doc },
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'fullscreen-preview-dialog',
      // Land focus on the close button, as the template's `autofocus` attribute used
      // to. Doing it through the dialog config instead runs after the open animation
      // and keeps focus inside the trap — a native autofocus on an element the CDK
      // injects is unreliable, and the attribute trips template/no-autofocus.
      autoFocus: '.preview__actions button',
    });
  }

  deleteDocument(doc: PatientDocument): void {
    this.confirmDialogService
      .confirm('patient.documents.deleteTitle', 'patient.documents.deleteMessage', {
        icon: 'delete',
        iconColor: 'danger',
      })
      .pipe(
        // Before switchMap: cancels the dialog, never an in-flight delete. This
        // component is lazy mat-tab content, so it is destroyed on every tab switch.
        takeUntilDestroyed(this.destroyRef),
        filter(Boolean),
        switchMap(() => this.documentService.delete(this.patientId(), doc.id)),
      )
      .subscribe({
        next: () => {
          if (this.selectedDocument()?.id === doc.id) {
            this.selectedDocument.set(undefined);
          }
          this.toastService.success('patient.documents.deleteSuccess');
        },
        error: err => this.toastService.error(err),
      });
  }

  getUploadedByName(doc: PatientDocument): string {
    if (!doc.uploadedByUserId) return '—';
    return this.userService.getDisplayName(doc.uploadedByUserId) || '—';
  }

  typeLabel(contentType: string): string {
    switch (contentType) {
      case 'application/pdf':
        return 'PDF';
      case 'image/jpeg':
        return 'JPG';
      case 'image/png':
        return 'PNG';
      case 'image/webp':
        return 'WEBP';
      default:
        return contentType;
    }
  }

  isImage(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  private acceptFile(file: File): void {
    if (!this.validateFile(file)) return;
    this.pendingFile.set(file);
  }

  private validateFile(file: File): boolean {
    if (!(DOCUMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      this.toastService.error('patient.documents.invalidType');
      return false;
    }
    if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
      this.toastService.error('patient.documents.tooLarge');
      return false;
    }
    return true;
  }
}
