import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { PatientService } from './patient.service';
import { UserService } from './user.service';
import { VisitService } from './visit.service';
import { DiagnosisService } from './diagnosis.service';
import { TreatmentService } from './treatment.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { TranslateService } from './translate.service';
import { Permission } from '../models/user.model';

const MESSAGE_DISMISS_MS = 5000;

/**
 * Owns the XLSX import: the subscription, the progress state, and the cache
 * refresh that follows a successful run.
 *
 * This lives in a root-provided service rather than in Home because Home is
 * destroyed on navigation. The import request itself already survived that (it is
 * deliberately not torn down), but the progress signals died with the component,
 * so navigating away mid-import lost the UI with no way to get it back.
 */
@Injectable({ providedIn: 'root' })
export class PatientImportService {
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  private messageTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _importing = signal(false);
  private readonly _message = signal('');
  private readonly _error = signal(false);
  private readonly _progress = signal(0);
  private readonly _currentFile = signal('');
  private readonly _total = signal(0);

  readonly importing = this._importing.asReadonly();
  readonly message = this._message.asReadonly();
  readonly error = this._error.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly currentFile = this._currentFile.asReadonly();
  readonly total = this._total.asReadonly();

  start(files: File[], doctorId: string | undefined): void {
    if (this._importing()) return;

    this._importing.set(true);
    this._message.set('');
    this._error.set(false);
    this._progress.set(0);
    this._currentFile.set('');
    this._total.set(0);
    this.clearMessageTimeout();

    // No takeUntilDestroyed: this observable's teardown aborts the underlying SSE
    // fetch, so cancelling would stop a running import part-way through with no
    // record of where it stopped. This service is root-provided and never
    // destroyed, so there is nothing to tear down against in any case.
    this.patientService.importXlsx(files, doctorId).subscribe({
      next: event => {
        if (event.type === 'progress') {
          this._total.set(event.total);
          this._currentFile.set(event.file);
          this._progress.set(Math.round(((event.current - 1) / event.total) * 100));
        } else if (event.type === 'file_done') {
          this._progress.set(Math.round((event.current / event.total) * 100));
        } else if (event.type === 'complete') {
          const s = event.summary;
          this._importing.set(false);
          this._error.set(false);
          this._message.set(
            this.translate.format('home.importSummary', {
              filesProcessed: s.filesProcessed,
              patientsCreated: s.patientsCreated,
              visitsCreated: s.visitsCreated,
            }),
          );
          this._progress.set(100);
          this.toast.success('toast.importSuccess');
          this.scheduleMessageDismiss();
          this.refreshCaches();
        }
      },
      error: err => {
        this._importing.set(false);
        this._error.set(true);
        const detail = err?.detail || err?.message || this.translate.instant('home.importUnknownError');
        this._message.set(this.translate.format('home.importFailed', { detail }));
        this._progress.set(0);
        this.scheduleMessageDismiss();
      },
    });
  }

  /**
   * An import creates patients and visits, so every cache that can show them has
   * to be reloaded. Each reload is isolated with catchError because forkJoin
   * unsubscribes its remaining sources on the first error, which would strand the
   * other caches holding pre-import data.
   *
   * The permission gating mirrors Home's initial load, and admin.ts keeps a third
   * variant of the same "reload these caches" list — worth consolidating when the
   * service layer is unified.
   */
  private refreshCaches(): void {
    const has = (p: Permission) => this.authService.hasPermission(p);
    const reloads: Observable<unknown>[] = [
      has(Permission.PatientsRead) ? this.patientService.loadAll() : of([]),
      has(Permission.UsersRead) ? this.userService.loadAll() : of([]),
      has(Permission.VisitsRead) ? this.visitService.loadAll() : of([]),
      has(Permission.DiagnosesRead) ? this.diagnosisService.loadAll() : of([]),
      has(Permission.TreatmentsRead) ? this.treatmentService.loadAll() : of([]),
    ];
    forkJoin(reloads.map(reload => reload.pipe(catchError(() => of(null))))).subscribe();
  }

  private scheduleMessageDismiss(): void {
    this.clearMessageTimeout();
    this.messageTimeout = setTimeout(() => {
      this._message.set('');
      this._error.set(false);
      this.messageTimeout = null;
    }, MESSAGE_DISMISS_MS);
  }

  private clearMessageTimeout(): void {
    if (this.messageTimeout !== null) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }
}
