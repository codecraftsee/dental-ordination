import { MAX_FILES_PER_REQUEST, MAX_REQUEST_BYTES, formatBytes, planImport } from './import-batch';

/** A File of a given size without allocating the bytes. */
function fileOf(name: string, size: number): File {
  const file = new File(['x'], name, { type: 'application/vnd.ms-excel' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const MB = 1024 * 1024;

describe('planImport', () => {
  it('keeps a small selection in one batch', () => {
    const files = [fileOf('a.xlsx', MB), fileOf('b.xlsx', MB)];
    const plan = planImport(files);

    expect(plan.batches.length).toBe(1);
    expect(plan.batches[0]).toEqual(files);
    expect(plan.accepted).toEqual(files);
    expect(plan.oversized).toEqual([]);
    expect(plan.totalBytes).toBe(2 * MB);
  });

  it('splits on the file count limit', () => {
    const files = Array.from({ length: MAX_FILES_PER_REQUEST + 1 }, (_, i) => fileOf(`f${i}.xlsx`, 1024));
    const plan = planImport(files);

    expect(plan.batches.length).toBe(2);
    expect(plan.batches[0].length).toBe(MAX_FILES_PER_REQUEST);
    expect(plan.batches[1].length).toBe(1);
  });

  // The bug this whole module exists for: batching on count alone lets 200 files
  // of 600 KB become a 120 MB request, which Caddy rejects with a bare 413.
  it('splits on the byte limit even when well under the count limit', () => {
    const files = Array.from({ length: 10 }, (_, i) => fileOf(`f${i}.xlsx`, 30 * MB));
    const plan = planImport(files);

    expect(files.length).toBeLessThan(MAX_FILES_PER_REQUEST);
    for (const batch of plan.batches) {
      const bytes = batch.reduce((sum, f) => sum + f.size, 0);
      expect(bytes).toBeLessThanOrEqual(MAX_REQUEST_BYTES);
    }
    expect(plan.accepted.length).toBe(10);
  });

  it('never emits a batch over either limit, for a mixed selection', () => {
    const files = [
      ...Array.from({ length: 150 }, (_, i) => fileOf(`small${i}.xlsx`, 100 * 1024)),
      ...Array.from({ length: 5 }, (_, i) => fileOf(`big${i}.xlsx`, 25 * MB)),
      ...Array.from({ length: 150 }, (_, i) => fileOf(`more${i}.xlsx`, 200 * 1024)),
    ];
    const plan = planImport(files);

    for (const batch of plan.batches) {
      expect(batch.length).toBeLessThanOrEqual(MAX_FILES_PER_REQUEST);
      expect(batch.reduce((sum, f) => sum + f.size, 0)).toBeLessThanOrEqual(MAX_REQUEST_BYTES);
    }
    expect(plan.batches.flat().length).toBe(files.length);
  });

  it('sets aside a file too large for any request instead of emitting a doomed batch', () => {
    const good = fileOf('ok.xlsx', MB);
    const huge = fileOf('huge.xlsx', MAX_REQUEST_BYTES + 1);
    const plan = planImport([good, huge]);

    expect(plan.oversized).toEqual([huge]);
    expect(plan.accepted).toEqual([good]);
    expect(plan.batches.flat()).toEqual([good]);
    expect(plan.totalBytes).toBe(MB);
  });

  it('accepts a file exactly at the limit', () => {
    const exact = fileOf('exact.xlsx', MAX_REQUEST_BYTES);
    const plan = planImport([exact]);

    expect(plan.oversized).toEqual([]);
    expect(plan.batches).toEqual([[exact]]);
  });

  it('preserves the order the user picked', () => {
    const files = Array.from({ length: 250 }, (_, i) => fileOf(`f${i}.xlsx`, 1024));
    const plan = planImport(files);

    expect(plan.batches.flat().map(f => f.name)).toEqual(files.map(f => f.name));
  });

  it('handles an empty selection', () => {
    const plan = planImport([]);
    expect(plan).toEqual({ batches: [], accepted: [], oversized: [], totalBytes: 0 });
  });

  it('produces no batches when every file is oversized', () => {
    const plan = planImport([fileOf('a.xlsx', MAX_REQUEST_BYTES + 1)]);
    expect(plan.batches).toEqual([]);
    expect(plan.accepted).toEqual([]);
  });
});

describe('formatBytes', () => {
  it('formats across units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(80 * MB)).toBe('80.0 MB');
  });
});
