import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslateService } from '../services/translate.service';
import { UserService } from '../services/user.service';
import { PatientImportService } from '../services/patient-import.service';
import { MAX_REQUEST_BYTES, planImport } from '../services/import-batch';
import { fileIdentity } from '../shared/file-identity';
import { formatBytes } from '../shared/format-bytes';
import { formatDuration } from '../shared/format-duration';
import { ImportAttribution, ImportFileOutcome, ImportFileResult } from '../models/import-run.model';
import { UserRole } from '../models/user.model';

/**
 * Throughput assumed before this browser has ever finished a run.
 *
 * Only a prior: a real rate depends on the API, the database's latency and how
 * many visits each card carries, and the moment one run finishes its measured
 * rate is stored and used instead. Deliberately conservative — an estimate that
 * comes in early is a good surprise, one that overruns is a broken promise.
 */
const ASSUMED_FILES_PER_MINUTE = 60;

/** `accept=".xlsx"` is only a picker hint, so every entry path filters for real. */
function isXlsx(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx');
}

type OutcomeFilter = 'all' | ImportFileOutcome;

const OUTCOME_FILTERS: OutcomeFilter[] = ['all', 'imported', 'skipped', 'incomplete', 'failed'];

/**
 * The import screen: pick the cards, start the run, read what happened.
 *
 * It renders the run rather than owning it — `PatientImportService` is
 * root-provided, so navigating away changes nothing and coming back shows the
 * same live state. Live progress is the shell panel's job; what is here and
 * nowhere else is the selection and the report.
 */
@Component({
  selector: 'app-import',
  imports: [ScrollingModule, MatButtonModule, MatCardModule, MatIconModule, TranslatePipe],
  templateUrl: './import.html',
  styleUrl: './import.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Import {
  private importService = inject(PatientImportService);
  private userService = inject(UserService);
  private translate = inject(TranslateService);

  readonly outcomeFilters = OUTCOME_FILTERS;
  readonly maxFileSize = formatBytes(MAX_REQUEST_BYTES);

  readonly selectedDoctorId = signal('');
  readonly selectedFallbackDoctorId = signal('');
  readonly selectedFiles = signal<File[]>([]);
  readonly dragging = signal(false);
  readonly showFileList = signal(false);
  readonly outcomeFilter = signal<OutcomeFilter>('all');
  readonly search = signal('');

  readonly importing = this.importService.importing;
  readonly state = this.importService.state;
  readonly canResume = this.importService.canResume;
  readonly interrupted = this.importService.interrupted;
  readonly persistenceDegraded = this.importService.persistenceDegraded;

  readonly doctors = computed(() => this.userService.getByRole(UserRole.Doctor));

  /**
   * Files left over from a run a previous page load never finished. The picked
   * selection is kept whole so the counts add up for the user; only what is
   * actually sent is narrowed.
   */
  readonly filesToImport = computed(() => {
    const files = this.selectedFiles();
    return this.interrupted() ? this.importService.outstandingFrom(files) : files;
  });

  readonly alreadyImportedCount = computed(
    () => this.selectedFiles().length - this.filesToImport().length,
  );

  readonly plan = computed(() => planImport(this.filesToImport()));
  readonly acceptedCount = computed(() => this.plan().accepted.length);
  readonly batchCount = computed(() => this.plan().batches.length);
  readonly totalSize = computed(() => formatBytes(this.plan().totalBytes));
  readonly oversizedFiles = computed(() => this.plan().oversized);

  /** What the run is likely to cost, so nobody starts an hour of work blind. */
  readonly estimatedDuration = computed(() => {
    const rate = this.importService.lastReport()?.filesPerMinute || ASSUMED_FILES_PER_MINUTE;
    return formatDuration((this.acceptedCount() / rate) * 60_000);
  });

  readonly tooLargeHint = computed(() => {
    this.translate.version();
    return this.translate.format('home.importTooLargeDesc', { size: this.maxFileSize });
  });

  readonly interruptedHint = computed(() => {
    this.translate.version();
    const manifest = this.interrupted();
    if (!manifest) return '';
    return this.translate.format('import.interruptedDesc', {
      done: manifest.doneIdentities.length,
      total: manifest.total,
    });
  });

  readonly skippedHint = computed(() => {
    this.translate.version();
    return this.translate.format('import.resumeSkipping', { count: this.alreadyImportedCount() });
  });

  readonly estimateHint = computed(() => {
    this.translate.version();
    return this.translate.format('import.planEstimate', { duration: this.estimatedDuration() });
  });

  /**
   * The two fields are alternatives, so exactly one is ever sent. A doctor
   * chosen for the whole import makes the fallback meaningless — nothing is
   * matched against the cards for it to catch — and sending a stale one would
   * imply a decision the user did not make on this run.
   */
  readonly attribution = computed<ImportAttribution>(() => {
    const doctorId = this.selectedDoctorId();
    if (doctorId) return { doctorId };
    const fallbackDoctorId = this.selectedFallbackDoctorId();
    return fallbackDoctorId ? { fallbackDoctorId } : {};
  });

  readonly fallbackHint = computed(() => {
    this.translate.version();
    return this.translate.translate('import.fallbackDoctorDesc');
  });

  readonly selectedDoctorName = computed(() => {
    const id = this.selectedDoctorId();
    return id ? this.userService.getDisplayName(id) : '';
  });

  /**
   * The report's rows. A finished run holds every file in memory; a page that
   * has only been refreshed has the persisted rows, which are the failures and
   * the incomplete ones — the successes are counts by then, because they are
   * exactly the rows nobody needs to read one by one.
   */
  readonly reportRows = computed<ImportFileResult[]>(() => {
    const live = this.importService.results();
    return live.length > 0 ? live : (this.importService.lastReport()?.attention ?? []);
  });

  readonly showingStoredRowsOnly = computed(
    () => this.importService.results().length === 0 && this.importService.lastReport() !== null,
  );

  readonly reportTruncated = computed(
    () => this.showingStoredRowsOnly() && (this.importService.lastReport()?.attentionTruncated ?? false),
  );

  readonly reportTallies = computed(() => {
    const live = this.importService.results();
    return live.length > 0
      ? this.importService.tallies()
      : (this.importService.lastReport()?.tallies ?? null);
  });

  readonly hasReport = computed(() => this.reportRows().length > 0 || this.reportTallies() !== null);

  readonly filteredRows = computed(() => {
    const outcome = this.outcomeFilter();
    const query = this.search().trim().toLowerCase();
    return this.reportRows().filter(row => {
      if (outcome !== 'all' && row.outcome !== outcome) return false;
      return !query || row.name.toLowerCase().includes(query);
    });
  });

  /**
   * Whether the run still has to be told who owns the visits no card can
   * identify. Only with several doctors and no single doctor chosen: one doctor
   * is the only possible answer, and `selectedDoctorId` skips card matching
   * altogether, so neither leaves anything to decide.
   */
  readonly needsFallback = computed(
    () =>
      !this.selectedDoctorId() && this.doctors().length > 1 && !this.selectedFallbackDoctorId(),
  );

  /**
   * Blocked rather than left to the API, which refuses such a run with a 400.
   * That status is not in `isRetryableBatchError`, so letting it through would
   * record the whole batch as permanently failed instead of asking a question
   * the user can answer in one click.
   */
  readonly canStart = computed(
    () => !this.importing() && this.acceptedCount() > 0 && !this.needsFallback(),
  );

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files).filter(isXlsx));
    // Clear, or picking the same folder again fires no change event and the
    // second "add more" appears to do nothing.
    input.value = '';
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
    if (files) this.addFiles(Array.from(files).filter(isXlsx));
  }

  removeFile(file: File): void {
    const identity = fileIdentity(file);
    this.selectedFiles.update(files => files.filter(other => fileIdentity(other) !== identity));
  }

  clearSelection(): void {
    this.selectedFiles.set([]);
    this.showFileList.set(false);
  }

  toggleFileList(): void {
    this.showFileList.update(shown => !shown);
  }

  setOutcomeFilter(outcome: OutcomeFilter): void {
    this.outcomeFilter.set(outcome);
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes);
  }

  outcomeKey(outcome: OutcomeFilter): string {
    return `import.filter.${outcome}`;
  }

  /**
   * What to show in the row's detail column.
   *
   * Errors when there are any — they name a specific problem and are what the
   * column has always shown. Otherwise the counters, because a file can be
   * `incomplete` with an empty `errors`: a visit with no price is flagged and
   * appends no error, which showed as "Incomplete" against a blank cell and gave
   * the operator nothing to act on.
   *
   * An unresolved doctor is reported here too. It flags nothing and is not a
   * problem — the fallback doctor is the answer for those rows — but it is the
   * only place the app says the card named somebody the roster could not match.
   */
  rowDetail(row: ImportFileResult): string {
    this.translate.version();
    if (row.errors.length) return row.errors.join('; ');

    const parts: string[] = [];
    if (row.visitsMissingPrice) {
      parts.push(
        this.translate.format('import.rowMissingPrice', { count: row.visitsMissingPrice }),
      );
    }
    if (row.visitsUnmatchedDoctor) {
      parts.push(
        this.translate.format('import.rowUnmatchedDoctor', { count: row.visitsUnmatchedDoctor }),
      );
    }
    return parts.join('; ');
  }

  /**
   * Names the file in the button's label. Every row otherwise announces the same
   * bare "Remove", which in a list of thousands says nothing about what is about
   * to be removed.
   */
  removeLabel(file: File): string {
    this.translate.version();
    return this.translate.format('import.removeFile', { name: file.name });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setDoctor(event: Event): void {
    this.selectedDoctorId.set((event.target as HTMLSelectElement).value);
  }

  setFallbackDoctor(event: Event): void {
    this.selectedFallbackDoctorId.set((event.target as HTMLSelectElement).value);
  }

  start(): void {
    if (!this.canStart()) return;
    this.importService.start(this.filesToImport(), this.attribution());
    this.selectedFiles.set([]);
    this.showFileList.set(false);
  }

  resume(): void {
    this.importService.resume();
  }

  discardInterrupted(): void {
    this.importService.discardInterrupted();
  }

  /**
   * The report as a file, because a list of a few hundred failures is something
   * you work through outside the browser — against the folders on disk — not
   * something you scroll.
   */
  exportCsv(): void {
    const header = [
      'file', 'outcome', 'patients_created', 'patients_updated',
      'visits_created', 'visits_skipped', 'errors',
    ];
    const rows = this.filteredRows().map(row => [
      row.name,
      row.outcome,
      String(row.patientsCreated),
      String(row.patientsUpdated),
      String(row.visitsCreated),
      String(row.visitsSkipped),
      row.errors.join('; '),
    ]);

    const csv = [header, ...rows].map(cells => cells.map(csvCell).join(',')).join('\r\n');
    // Leading BOM, or Excel reads the UTF-8 Serbian names as mojibake.
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'import-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Append rather than replace, so a second folder adds to the selection instead
   * of silently discarding the first.
   *
   * Deduped on `fileIdentity`, not on name: every patient folder holds a
   * `karton.xlsx`, and dropping one because another was picked first is silent
   * data loss in an import tool.
   */
  private addFiles(incoming: File[]): void {
    if (incoming.length === 0) return;
    this.selectedFiles.update(current => {
      const seen = new Set(current.map(fileIdentity));
      const added: File[] = [];
      for (const file of incoming) {
        const identity = fileIdentity(file);
        if (seen.has(identity)) continue;
        seen.add(identity);
        added.push(file);
      }
      return added.length > 0 ? [...current, ...added] : current;
    });
  }
}

/** RFC 4180: quote when the value could otherwise break the row. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
