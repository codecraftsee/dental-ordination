import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { WritableSignal, signal } from '@angular/core';
import { vi } from 'vitest';
import Import from './import';
import { TranslateService } from '../services/translate.service';
import { UserService } from '../services/user.service';
import { PatientImportService } from '../services/patient-import.service';
import { MAX_REQUEST_BYTES } from '../services/import-batch';
import { fileIdentity } from '../shared/file-identity';
import {
  ImportFileResult,
  ImportRunState,
  ImportRunTallies,
  StoredRunManifest,
  StoredRunReport,
  emptyTallies,
} from '../models/import-run.model';
import { UserRole } from '../models/user.model';

/** A File of a given size without allocating the bytes. */
function fileOf(name: string, size = 1024, mtime = 0): File {
  const file = new File(['x'], name, { lastModified: mtime });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/** jsdom has no usable FileList, so the handlers get a shaped stand-in. */
function changeEvent(files: File[]): Event {
  const input = { files, value: 'C:\\fakepath\\picked.xlsx' } as unknown as HTMLInputElement;
  return { target: input } as unknown as Event;
}

function dropEvent(files: File[]): DragEvent {
  return { preventDefault: () => undefined, dataTransfer: { files } } as unknown as DragEvent;
}

const row = (
  name: string,
  outcome: ImportFileResult['outcome'],
  errors: string[] = [],
): ImportFileResult => ({
  name,
  identity: fileIdentity(fileOf(name)),
  outcome,
  patientsCreated: outcome === 'imported' ? 1 : 0,
  patientsUpdated: 0,
  visitsCreated: outcome === 'imported' ? 3 : 0,
  visitsSkipped: outcome === 'skipped' ? 5 : 0,
  visitsMissingPrice: 0,
  visitsUnmatchedDoctor: 0,
  errors,
});

describe('Import', () => {
  let component: Import;
  let fixture: ComponentFixture<Import>;
  let results: WritableSignal<ImportFileResult[]>;
  let tallies: WritableSignal<ImportRunTallies>;
  let lastReport: WritableSignal<StoredRunReport | null>;
  let interrupted: WritableSignal<StoredRunManifest | null>;
  /** Set before `build()`; how many doctors exist decides whether a fallback is needed. */
  let doctorList: { id: string; firstName: string; lastName: string }[];
  let state: WritableSignal<ImportRunState>;
  let importing: WritableSignal<boolean>;
  let canResume: WritableSignal<boolean>;
  let start: ReturnType<typeof vi.fn>;
  let resume: ReturnType<typeof vi.fn>;
  let discardInterrupted: ReturnType<typeof vi.fn>;

  const build = async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Import],
      providers: [
        provideNoopAnimations(),
        {
          provide: PatientImportService,
          useValue: {
            results: results.asReadonly(),
            tallies: tallies.asReadonly(),
            lastReport: lastReport.asReadonly(),
            interrupted: interrupted.asReadonly(),
            state: state.asReadonly(),
            importing: importing.asReadonly(),
            canResume: canResume.asReadonly(),
            persistenceDegraded: signal(false).asReadonly(),
            outstandingFrom: (files: File[]) => {
              const done = new Set(interrupted()?.doneIdentities ?? []);
              return files.filter(file => !done.has(fileIdentity(file)));
            },
            start,
            resume,
            discardInterrupted,
          },
        },
        {
          provide: UserService,
          useValue: {
            getByRole: (role: UserRole) => (role === UserRole.Doctor ? doctorList : []),
            getDisplayName: () => 'Dr. Ana',
          },
        },
        {
          provide: TranslateService,
          useValue: {
            version: signal(0),
            translate: (key: string) => key,
            translatePlural: (key: string) => key,
            instant: (key: string) => key,
            format: (key: string, params: Record<string, string | number>) =>
              `${key}|${Object.values(params).join(',')}`,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Import);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    results = signal<ImportFileResult[]>([]);
    tallies = signal<ImportRunTallies>(emptyTallies());
    lastReport = signal<StoredRunReport | null>(null);
    interrupted = signal<StoredRunManifest | null>(null);
    doctorList = [{ id: 'd1', firstName: 'Ana', lastName: 'Jovanović' }];
    state = signal<ImportRunState>('idle');
    importing = signal(false);
    canResume = signal(false);
    start = vi.fn();
    resume = vi.fn();
    discardInterrupted = vi.fn();
    await build();
  });

  describe('selecting files', () => {
    it('accepts a folder pick, keeping only xlsx', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx'), fileOf('notes.pdf'), fileOf('b.xlsx')]));

      expect(component.selectedFiles().map(f => f.name)).toEqual(['a.xlsx', 'b.xlsx']);
    });

    it('accepts a drop, keeping only xlsx', () => {
      component.onDrop(dropEvent([fileOf('a.xlsx'), fileOf('x.docx')]));

      expect(component.selectedFiles()).toHaveLength(1);
    });

    it('appends rather than replacing, so a second folder adds to the first', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.onFilesSelected(changeEvent([fileOf('b.xlsx')]));

      expect(component.selectedFiles()).toHaveLength(2);
    });

    it('dedupes a folder picked twice', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx', 100, 5)]));
      component.onFilesSelected(changeEvent([fileOf('a.xlsx', 100, 5)]));

      expect(component.selectedFiles()).toHaveLength(1);
    });

    /** Every patient folder holds a `karton.xlsx`; dropping one is data loss. */
    it('keeps same-named cards from different patients', () => {
      component.onFilesSelected(
        changeEvent([fileOf('karton.xlsx', 100, 1), fileOf('karton.xlsx', 200, 2)]),
      );

      expect(component.selectedFiles()).toHaveLength(2);
    });

    it('removes one file without disturbing the rest', () => {
      const keep = fileOf('a.xlsx', 100, 1);
      const drop = fileOf('b.xlsx', 100, 2);
      component.onFilesSelected(changeEvent([keep, drop]));

      component.removeFile(drop);

      expect(component.selectedFiles().map(f => f.name)).toEqual(['a.xlsx']);
    });

    it('clears the whole selection', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.clearSelection();

      expect(component.selectedFiles()).toEqual([]);
      expect(component.showFileList()).toBe(false);
    });
  });

  describe('the selection summary', () => {
    it('reports files, size, uploads and an estimate before anything is sent', () => {
      const files = Array.from({ length: 120 }, (_, i) => fileOf(`card${i}.xlsx`, 1024, i));
      component.onFilesSelected(changeEvent(files));

      expect(component.acceptedCount()).toBe(120);
      expect(component.batchCount()).toBe(3);
      expect(component.totalSize()).toContain('KB');
      // 120 files at the assumed 60/min.
      expect(component.estimatedDuration()).toBe('2m 00s');
    });

    /** Once a run has happened, the estimate uses what actually happened. */
    it('prefers the measured rate from the last run', async () => {
      lastReport.set({
        finishedAt: 1,
        state: 'completed',
        total: 10,
        processed: 10,
        tallies: emptyTallies(),
        filesPerMinute: 240,
        attention: [],
        attentionTruncated: false,
      });
      await build();

      component.onFilesSelected(
        changeEvent(Array.from({ length: 120 }, (_, i) => fileOf(`card${i}.xlsx`, 1024, i))),
      );

      expect(component.estimatedDuration()).toBe('30s');
    });

    it('sets aside a file too large to ever be sent', () => {
      component.onFilesSelected(
        changeEvent([fileOf('ok.xlsx', 1024, 1), fileOf('huge.xlsx', MAX_REQUEST_BYTES + 1, 2)]),
      );

      expect(component.oversizedFiles().map(f => f.name)).toEqual(['huge.xlsx']);
      expect(component.acceptedCount()).toBe(1);
    });

    /** 8,000 rows must not reach the DOM before anyone asks to see them. */
    it('keeps the file list collapsed until asked', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport')).toBeNull();

      component.toggleFileList();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport')).not.toBeNull();
    });
  });

  describe('starting a run', () => {
    it('hands the files and the chosen doctor to the service', () => {
      const files = [fileOf('a.xlsx', 100, 1), fileOf('b.xlsx', 100, 2)];
      component.onFilesSelected(changeEvent(files));
      component.selectedDoctorId.set('d1');
      // Captured before starting: start() clears the selection.
      const expected = component.filesToImport();

      component.start();

      expect(start).toHaveBeenCalledWith(expected, { doctorId: 'd1' });
    });

    it('passes neither field when left on auto-detect with nothing to fall back to', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.start();

      expect(start.mock.calls[0][1]).toEqual({});
    });

    it('clears the selection once the run is under way', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.start();

      expect(component.selectedFiles()).toEqual([]);
    });

    it('refuses to start with nothing sendable', () => {
      component.onFilesSelected(changeEvent([fileOf('huge.xlsx', MAX_REQUEST_BYTES + 1)]));

      expect(component.canStart()).toBe(false);
      component.start();
      expect(start).not.toHaveBeenCalled();
    });

    it('refuses to start a second run over a running one', async () => {
      importing.set(true);
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));

      expect(component.canStart()).toBe(false);
    });
  });

  describe('continuing an interrupted run', () => {
    beforeEach(async () => {
      interrupted.set({
        doneIdentities: [fileIdentity(fileOf('a.xlsx', 100, 1)), fileIdentity(fileOf('b.xlsx', 100, 2))],
        total: 4,
        attribution: { doctorId: 'd1' },
        startedAt: 1,
      });
      await build();
    });

    it('says where the earlier run stopped', () => {
      expect(component.interruptedHint()).toBe('import.interruptedDesc|2,4');
    });

    it('leaves out the files that already imported', () => {
      const files = [
        fileOf('a.xlsx', 100, 1),
        fileOf('b.xlsx', 100, 2),
        fileOf('c.xlsx', 100, 3),
        fileOf('d.xlsx', 100, 4),
      ];
      component.onFilesSelected(changeEvent(files));

      expect(component.selectedFiles()).toHaveLength(4);
      expect(component.filesToImport().map(f => f.name)).toEqual(['c.xlsx', 'd.xlsx']);
      expect(component.alreadyImportedCount()).toBe(2);
    });

    it('sends only the outstanding files', () => {
      component.onFilesSelected(
        changeEvent([fileOf('a.xlsx', 100, 1), fileOf('c.xlsx', 100, 3)]),
      );

      component.start();

      expect((start.mock.calls[0][0] as File[]).map(f => f.name)).toEqual(['c.xlsx']);
    });

    it('treats files the manifest never saw as a fresh selection', () => {
      component.onFilesSelected(changeEvent([fileOf('z.xlsx', 100, 9)]));

      expect(component.filesToImport()).toHaveLength(1);
      expect(component.alreadyImportedCount()).toBe(0);
    });

    it('discards it when declined', () => {
      component.discardInterrupted();
      expect(discardInterrupted).toHaveBeenCalled();
    });
  });

  describe('the report', () => {
    beforeEach(() => {
      results.set([
        row('a.xlsx', 'imported'),
        row('b.xlsx', 'skipped'),
        row('c.xlsx', 'incomplete', ['row 7: no doctor']),
        row('d.xlsx', 'failed', ['boom']),
      ]);
      tallies.set({ ...emptyTallies(), filesImported: 1, filesSkipped: 1, filesIncomplete: 1, filesFailed: 1 });
      fixture.detectChanges();
    });

    it('lists every file of a finished run', () => {
      expect(component.reportRows()).toHaveLength(4);
      expect(component.hasReport()).toBe(true);
    });

    describe('the detail column', () => {
      it('shows the errors when there are any', () => {
        expect(component.rowDetail(row('c.xlsx', 'incomplete', ['row 7: no doctor']))).toBe(
          'row 7: no doctor',
        );
      });

      /**
       * The gap this closed: a visit with no price is flagged and appends no
       * error, so the row read "Incomplete" against an empty cell and the
       * operator had nothing to act on.
       */
      it('explains an incomplete file that carries no error', () => {
        const priced = { ...row('e.xlsx', 'incomplete'), visitsMissingPrice: 2 };

        expect(component.rowDetail(priced)).toBe('import.rowMissingPrice|2');
      });

      it('reports rows that went to the fallback doctor, which flag nothing', () => {
        const fallback = { ...row('f.xlsx', 'imported'), visitsUnmatchedDoctor: 3 };

        expect(component.rowDetail(fallback)).toBe('import.rowUnmatchedDoctor|3');
      });

      it('joins both reasons when a file has each', () => {
        const both = {
          ...row('g.xlsx', 'incomplete'),
          visitsMissingPrice: 1,
          visitsUnmatchedDoctor: 4,
        };

        expect(component.rowDetail(both)).toBe(
          'import.rowMissingPrice|1; import.rowUnmatchedDoctor|4',
        );
      });

      it('says nothing for a clean file', () => {
        expect(component.rowDetail(row('a.xlsx', 'imported'))).toBe('');
      });
    });

    it('filters by outcome', () => {
      component.setOutcomeFilter('failed');

      expect(component.filteredRows().map(r => r.name)).toEqual(['d.xlsx']);
    });

    it('searches by file name', () => {
      component.search.set('C.XLS');

      expect(component.filteredRows().map(r => r.name)).toEqual(['c.xlsx']);
    });

    it('combines the filter and the search', () => {
      component.setOutcomeFilter('failed');
      component.search.set('a');

      expect(component.filteredRows()).toEqual([]);
    });

    /**
     * The case that used to lose everything: a refresh after a long run. The
     * failures survive; the successes are counts by then.
     */
    it('falls back to the persisted rows after a refresh', async () => {
      results.set([]);
      lastReport.set({
        finishedAt: 1,
        state: 'completed',
        total: 8140,
        processed: 8140,
        tallies: { ...emptyTallies(), filesImported: 8138, filesFailed: 2 },
        filesPerMinute: 120,
        attention: [row('x.xlsx', 'failed', ['boom'])],
        attentionTruncated: false,
      });
      await build();

      expect(component.showingStoredRowsOnly()).toBe(true);
      expect(component.reportRows()).toHaveLength(1);
      expect(component.reportTallies()?.filesImported).toBe(8138);
      expect(component.hasReport()).toBe(true);
    });

    it('says so when the stored rows were capped', async () => {
      results.set([]);
      lastReport.set({
        finishedAt: 1,
        state: 'completed',
        total: 10,
        processed: 10,
        tallies: emptyTallies(),
        filesPerMinute: 60,
        attention: [row('x.xlsx', 'failed')],
        attentionTruncated: true,
      });
      await build();

      expect(component.reportTruncated()).toBe(true);
    });

    it('offers to retry the outstanding files', () => {
      canResume.set(true);
      fixture.detectChanges();

      component.resume();

      expect(resume).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('names the file in each remove button, not just "remove"', () => {
      expect(component.removeLabel(fileOf('karton.xlsx'))).toBe('import.removeFile|karton.xlsx');
    });

    /**
     * The viewport is the scroll container, so without a tab stop its contents
     * are unreachable from the keyboard entirely.
     */
    it('makes the selection list keyboard-reachable and labelled', () => {
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.toggleFileList();
      fixture.detectChanges();

      const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
      expect(viewport.getAttribute('tabindex')).toBe('0');
      expect(viewport.getAttribute('aria-label')).toBe('import.fileListLabel');
    });

    it('makes the report list keyboard-reachable and labelled', () => {
      results.set([row('d.xlsx', 'failed', ['boom'])]);
      fixture.detectChanges();

      const viewport = fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport');
      expect(viewport.getAttribute('tabindex')).toBe('0');
      expect(viewport.getAttribute('aria-label')).toBe('import.reportListLabel');
    });

    it('marks the active outcome filter as pressed', () => {
      results.set([row('d.xlsx', 'failed')]);
      fixture.detectChanges();

      const chips: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('.import-page__chip'),
      );
      expect(chips[0].getAttribute('aria-pressed')).toBe('true');
      expect(chips[1].getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('CSV export', () => {
    let createObjectURL: ReturnType<typeof vi.fn>;
    let blobs: Blob[];

    /** jsdom's Blob has no `text()`, so the bytes come back via FileReader. */
    const readBlob = (blob: Blob) =>
      new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(blob);
      });

    beforeEach(() => {
      blobs = [];
      createObjectURL = vi.fn((blob: Blob) => {
        blobs.push(blob);
        return 'blob:fake';
      });
      vi.stubGlobal('URL', {
        ...URL,
        createObjectURL,
        revokeObjectURL: vi.fn(),
      });
      results.set([row('a.xlsx', 'imported'), row('d.xlsx', 'failed', ['boom'])]);
      fixture.detectChanges();
    });

    afterEach(() => vi.unstubAllGlobals());

    it('produces a row per file, with a header', async () => {
      component.exportCsv();

      const csv = await readBlob(blobs[0]);
      const lines = csv.split('\r\n');
      expect(lines[0]).toContain('file,outcome');
      expect(lines).toHaveLength(3);
      expect(lines[2]).toContain('d.xlsx,failed');
    });

    it('exports what is on screen, not the whole run', async () => {
      component.setOutcomeFilter('failed');

      component.exportCsv();

      const csv = await readBlob(blobs[0]);
      expect(csv).not.toContain('a.xlsx');
      expect(csv).toContain('d.xlsx');
    });

    /** A reason containing a comma must not silently become two columns. */
    it('quotes values that would otherwise break the row', async () => {
      results.set([row('odd,name.xlsx', 'failed', ['broke, badly'])]);
      fixture.detectChanges();

      component.exportCsv();

      const csv = await readBlob(blobs[0]);
      expect(csv).toContain('"odd,name.xlsx"');
      expect(csv).toContain('"broke, badly"');
    });
  });
  describe('choosing who owns unidentifiable visits', () => {
    const twoDoctors = [
      { id: 'd1', firstName: 'Ana', lastName: 'Jovanović' },
      { id: 'd2', firstName: 'Marko', lastName: 'Petrović' },
    ];

    it('needs no fallback when only one doctor exists', async () => {
      await build();
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));

      expect(component.needsFallback()).toBe(false);
      expect(component.canStart()).toBe(true);
    });

    it('blocks Start when several doctors exist and nobody has been chosen', async () => {
      doctorList = twoDoctors;
      await build();
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));

      expect(component.needsFallback()).toBe(true);
      expect(component.canStart()).toBe(false);

      component.start();
      expect(start).not.toHaveBeenCalled();
    });

    it('unblocks once a fallback is chosen, and sends it', async () => {
      doctorList = twoDoctors;
      await build();
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.selectedFallbackDoctorId.set('d2');

      expect(component.canStart()).toBe(true);

      component.start();
      expect(start.mock.calls[0][1]).toEqual({ fallbackDoctorId: 'd2' });
    });

    it('unblocks by assigning one doctor to the whole import instead', async () => {
      doctorList = twoDoctors;
      await build();
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.selectedDoctorId.set('d1');

      expect(component.needsFallback()).toBe(false);

      component.start();
      expect(start.mock.calls[0][1]).toEqual({ doctorId: 'd1' });
    });

    it('never sends both, even if a fallback was picked first', async () => {
      doctorList = twoDoctors;
      await build();
      component.onFilesSelected(changeEvent([fileOf('a.xlsx')]));
      component.selectedFallbackDoctorId.set('d2');
      component.selectedDoctorId.set('d1');

      component.start();

      // doctor_id skips card matching outright, so a fallback has nothing to
      // catch — sending one would imply a decision with no effect.
      expect(start.mock.calls[0][1]).toEqual({ doctorId: 'd1' });
    });

    it('hides the fallback select once a doctor is assigned', async () => {
      doctorList = twoDoctors;
      await build();
      const selects = () => fixture.nativeElement.querySelectorAll('select').length;

      expect(selects()).toBe(2);

      component.selectedDoctorId.set('d1');
      fixture.detectChanges();

      expect(selects()).toBe(1);
    });
  });
});
