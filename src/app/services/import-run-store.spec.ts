import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ImportRunStore, MAX_STORED_ATTENTION_ROWS } from './import-run-store';
import {
  ImportFileResult,
  StoredRunManifest,
  StoredRunReport,
  emptyTallies,
} from '../models/import-run.model';

const MANIFEST_KEY = 'import.run.manifest';
const REPORT_KEY = 'import.run.report';

const manifest: StoredRunManifest = {
  doneIdentities: ['a.xlsx|10|1', 'b.xlsx|20|2'],
  total: 5,
  attribution: { doctorId: 'doc-1' },
  startedAt: 1_700_000_000_000,
};

const row = (name: string, outcome: ImportFileResult['outcome'] = 'failed'): ImportFileResult => ({
  name,
  identity: `${name}|1|1`,
  outcome,
  patientsCreated: 0,
  patientsUpdated: 0,
  visitsCreated: 0,
  visitsSkipped: 0,
  errors: ['boom'],
});

const report = (attention: ImportFileResult[]): StoredRunReport => ({
  finishedAt: 1_700_000_000_000,
  state: 'completed',
  total: 10,
  processed: 10,
  tallies: emptyTallies(),
  filesPerMinute: 42,
  attention,
  attentionTruncated: false,
});

describe('ImportRunStore', () => {
  let store: ImportRunStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    store = TestBed.inject(ImportRunStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('manifest', () => {
    it('round-trips', () => {
      store.writeManifest(manifest);
      expect(store.readManifest()).toEqual(manifest);
    });

    it('reads null when nothing was stored', () => {
      expect(store.readManifest()).toBeNull();
    });

    it('clears', () => {
      store.writeManifest(manifest);
      store.clearManifest();
      expect(store.readManifest()).toBeNull();
    });

    /**
     * A payload from an older shape must not be handed back as if it were
     * current: resume would trust `doneIdentities` and skip files that were
     * never imported, which is silent data loss.
     */
    it('drops a payload that does not match the current shape', () => {
      localStorage.setItem(MANIFEST_KEY, JSON.stringify({ doneCount: 3, total: 5 }));

      expect(store.readManifest()).toBeNull();
      expect(localStorage.getItem(MANIFEST_KEY)).toBeNull();
    });

    it('drops a payload whose identities are not strings', () => {
      localStorage.setItem(
        MANIFEST_KEY,
        JSON.stringify({ doneIdentities: [1, 2], total: 5, startedAt: 1 }),
      );

      expect(store.readManifest()).toBeNull();
    });

    it('survives unparseable storage', () => {
      localStorage.setItem(MANIFEST_KEY, 'not json {');

      expect(store.readManifest()).toBeNull();
    });
  });

  describe('report', () => {
    it('round-trips', () => {
      store.writeReport(report([row('a.xlsx')]));

      const stored = store.readReport();
      expect(stored?.attention).toHaveLength(1);
      expect(stored?.attention[0].name).toBe('a.xlsx');
      expect(stored?.attentionTruncated).toBe(false);
    });

    it('drops a payload that does not match the current shape', () => {
      localStorage.setItem(REPORT_KEY, JSON.stringify({ finishedAt: 1 }));

      expect(store.readReport()).toBeNull();
      expect(localStorage.getItem(REPORT_KEY)).toBeNull();
    });

    /** A cap that hides rows without saying so reads as "that was all of them". */
    it('caps the stored rows and says when it did', () => {
      const rows = Array.from({ length: MAX_STORED_ATTENTION_ROWS + 5 }, (_, i) => row(`f${i}.xlsx`));
      store.writeReport(report(rows));

      const stored = store.readReport();
      expect(stored?.attention).toHaveLength(MAX_STORED_ATTENTION_ROWS);
      expect(stored?.attentionTruncated).toBe(true);
    });

    it('clears', () => {
      store.writeReport(report([row('a.xlsx')]));
      store.clearReport();
      expect(store.readReport()).toBeNull();
    });
  });

  describe('when storage refuses a write', () => {
    /** Installed per test, so a test can seed storage before writes start failing. */
    const failWrites = () =>
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

    it('records that persistence is no longer reliable', () => {
      expect(store.degraded()).toBe(false);
      failWrites();

      store.writeManifest(manifest);

      expect(store.degraded()).toBe(true);
    });

    /**
     * Better to have no manifest than half of one: resume reads
     * `doneIdentities` as the full list of what landed, so a stale payload left
     * behind by a failed write would have it skip files that never imported.
     */
    it('leaves no partial manifest behind', () => {
      store.writeManifest(manifest);
      failWrites();

      store.writeManifest({ ...manifest, doneIdentities: ['c.xlsx|1|1'] });

      expect(store.readManifest()).toBeNull();
    });

    it('does not throw into the caller', () => {
      failWrites();
      expect(() => store.writeReport(report([row('a.xlsx')]))).not.toThrow();
    });
  });
});
