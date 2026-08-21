import { Injectable, computed, signal } from '@angular/core';
import { ImportRunState } from '../models/import-run.model';

/**
 * Just the run's phase, and deliberately nothing else.
 *
 * The app shell has to know whether an import is happening — to decide whether
 * to show the progress panel, and whether to warn before the tab closes. Reading
 * that from `PatientImportService` would drag its whole dependency graph, and
 * Material's dialog and progress bar with it, into the initial bundle: ~85 kB
 * for a feature only admins use and that is idle almost all of the time.
 *
 * This holds the state instead. It has no dependencies, so the shell stays
 * light and the panel loads on the first run through `@defer`.
 * `PatientImportService` owns the transitions.
 */
@Injectable({ providedIn: 'root' })
export class ImportRunStatus {
  private readonly _state = signal<ImportRunState>('idle');

  readonly state = this._state.asReadonly();

  /** A run is in flight — the case a tab close would destroy. */
  readonly running = computed(() => {
    const state = this._state();
    return state === 'uploading' || state === 'processing' || state === 'cancelling';
  });

  /** There is something to show: a live run, or a terminal one not yet dismissed. */
  readonly visible = computed(() => this._state() !== 'idle');

  set(state: ImportRunState): void {
    this._state.set(state);
  }
}
