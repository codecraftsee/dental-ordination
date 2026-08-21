import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '../translate.pipe';
import { TranslateService } from '../../services/translate.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { PatientImportService } from '../../services/patient-import.service';
import { ImportRunState } from '../../models/import-run.model';
import { formatDuration } from '../format-duration';

const PHASE_KEYS: Record<ImportRunState, string> = {
  idle: '',
  // `uploading` is interpolated with batch numbers rather than looked up here.
  uploading: '',
  processing: 'import.phaseProcessing',
  cancelling: 'import.phaseCancelling',
  stopped: 'import.phaseStopped',
  completed: 'import.phaseCompleted',
  failed: 'import.phaseFailed',
};

/**
 * The run's progress, rendered by the app shell rather than by whatever route
 * happens to be open.
 *
 * A run already survived navigation — `PatientImportService` is root-provided —
 * but its progress card lived on the dashboard, so leaving that route hid the
 * only view of an hour-long job. Everything here reads service signals and owns
 * nothing but whether it is collapsed.
 */
@Component({
  selector: 'app-import-progress',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, TranslatePipe],
  templateUrl: './import-progress.html',
  styleUrl: './import-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportProgress {
  private importService = inject(PatientImportService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly collapsed = signal(false);

  readonly state = this.importService.state;
  readonly importing = this.importService.importing;
  readonly progress = this.importService.progress;
  readonly currentFile = this.importService.currentFile;
  readonly tallies = this.importService.tallies;
  readonly message = this.importService.message;
  readonly error = this.importService.error;
  readonly canResume = this.importService.canResume;

  readonly visible = computed(() => this.state() !== 'idle');

  /**
   * Naming the upload phase is the whole point of having one: `fetch` cannot
   * report upload bytes and the API streams nothing until it holds the entire
   * body, so the bar genuinely cannot move while a batch is on the wire. Saying
   * which upload is in flight turns a frozen bar into visible progress.
   */
  readonly phaseText = computed(() => {
    // Read so the label re-renders when the language changes; `format` and
    // `instant` are plain calls and not reactive on their own.
    this.translate.version();

    if (this.state() === 'uploading') {
      return this.translate.format('import.phaseUploading', {
        batch: this.importService.batchIndex(),
        batches: this.importService.batchCount(),
      });
    }
    const key = PHASE_KEYS[this.state()];
    return key ? this.translate.instant(key) : '';
  });

  readonly counterText = computed(() => {
    this.translate.version();
    return this.translate.format('import.fileCounter', {
      processed: this.importService.processed(),
      total: this.importService.total(),
    });
  });

  readonly elapsedText = computed(() => formatDuration(this.importService.elapsedMs()));

  readonly remainingText = computed(() => {
    const eta = this.importService.etaMs();
    return eta === null ? '—' : formatDuration(eta);
  });

  readonly rateText = computed(() => {
    this.translate.version();
    return this.translate.format('import.rate', {
      rate: Math.round(this.importService.filesPerMinute()),
    });
  });

  /**
   * What a screen reader hears, and deliberately almost nothing.
   *
   * The visible numbers change once per file — 8,000 times on a real migration.
   * Putting those in a live region would make the page unusable, so the region
   * carries only "a run is going" and, once it ends, the outcome. Both are
   * constant for as long as they apply, so each is announced exactly once.
   */
  readonly announcement = computed(() => {
    this.translate.version();
    return this.importing() ? this.translate.instant('import.announceStarted') : this.message();
  });

  toggleCollapsed(): void {
    this.collapsed.update(collapsed => !collapsed);
  }

  requestCancel(): void {
    this.confirmDialogService
      .confirm('import.cancelTitle', 'import.cancelMessage', {
        icon: 'stop_circle',
        iconColor: 'warning',
      })
      .pipe(takeUntilDestroyed(this.destroyRef), filter(Boolean))
      // A run can finish while the dialog is open; cancel() no-ops when there is
      // nothing in flight.
      .subscribe(() => this.importService.cancel());
  }

  resume(): void {
    this.importService.resume();
  }

  dismiss(): void {
    this.importService.dismiss();
    this.collapsed.set(false);
  }
}
