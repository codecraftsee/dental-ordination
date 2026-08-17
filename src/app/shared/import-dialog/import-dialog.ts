import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../translate.pipe';
import { TranslateService } from '../../services/translate.service';
import { UserService } from '../../services/user.service';
import { MAX_REQUEST_BYTES, formatBytes, planImport } from '../../services/import-batch';
import { UserRole } from '../../models/user.model';

export interface ImportDialogResult {
  doctorId: string | undefined;
  files: File[];
}

@Component({
  selector: 'app-import-dialog',
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './import-dialog.html',
  styleUrl: './import-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDialog {
  private dialogRef = inject(MatDialogRef<ImportDialog>);
  private userService = inject(UserService);
  private translate = inject(TranslateService);

  step = signal<1 | 2>(1);
  selectedDoctorId = signal('');
  selectedFiles = signal<File[]>([]);
  dragging = signal(false);

  doctors = computed(() => this.userService.getByRole(UserRole.Doctor));

  /**
   * What the current selection would actually do: how it splits into requests,
   * and which files are too large to send at all. Derived rather than stored, so
   * adding or removing a file re-plans on its own.
   */
  plan = computed(() => planImport(this.selectedFiles()));
  batchCount = computed(() => this.plan().batches.length);
  acceptedCount = computed(() => this.plan().accepted.length);
  oversizedFiles = computed(() => this.plan().oversized);
  totalSize = computed(() => formatBytes(this.plan().totalBytes));
  maxFileSize = formatBytes(MAX_REQUEST_BYTES);

  /**
   * Interpolated rather than piped: TranslatePipe takes only a `count`, and this
   * needs a size. Reading `version()` keeps it reactive to a language switch.
   */
  tooLargeHint = computed(() => {
    this.translate.version();
    return this.translate.format('home.importTooLargeDesc', { size: this.maxFileSize });
  });

  formatSize(bytes: number): string {
    return formatBytes(bytes);
  }

  isOversized(file: File): boolean {
    return file.size > MAX_REQUEST_BYTES;
  }

  selectedDoctorName = computed(() => {
    const id = this.selectedDoctorId();
    if (!id) return '';
    return this.userService.getDisplayName(id);
  });

  nextStep(): void {
    this.step.set(2);
  }

  prevStep(): void {
    this.step.set(1);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles.set(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const xlsx = Array.from(files).filter(f => f.name.endsWith('.xlsx'));
      if (xlsx.length > 0) {
        this.selectedFiles.set(xlsx);
      }
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  confirm(): void {
    const result: ImportDialogResult = {
      // `accepted`, not `selectedFiles`: anything too large to fit in a request is
      // shown in the list but never handed to the import.
      doctorId: this.selectedDoctorId() || undefined,
      files: this.plan().accepted,
    };
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
