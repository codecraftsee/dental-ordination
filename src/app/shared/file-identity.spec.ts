import { fileIdentity } from './file-identity';

/** A File with controlled size and mtime, without allocating the bytes. */
function fileOf(name: string, size: number, lastModified: number): File {
  const file = new File(['x'], name, { lastModified });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('fileIdentity', () => {
  it('is stable for the same file', () => {
    const file = fileOf('karton.xlsx', 4096, 1_700_000_000_000);
    expect(fileIdentity(file)).toBe(fileIdentity(file));
  });

  it('matches two picks of the same underlying file', () => {
    const first = fileOf('karton.xlsx', 4096, 1_700_000_000_000);
    const second = fileOf('karton.xlsx', 4096, 1_700_000_000_000);
    expect(fileIdentity(first)).toBe(fileIdentity(second));
  });

  /**
   * The reason this is not keyed on name alone: every patient folder holds a
   * `karton.xlsx`, so collapsing them would drop cards that were never imported.
   */
  it('separates same-named cards from different patients', () => {
    const marko = fileOf('karton.xlsx', 4096, 1_700_000_000_000);
    const ana = fileOf('karton.xlsx', 8192, 1_700_000_000_000);
    expect(fileIdentity(marko)).not.toBe(fileIdentity(ana));
  });

  it('separates cards that differ only by when they were last edited', () => {
    const before = fileOf('karton.xlsx', 4096, 1_700_000_000_000);
    const after = fileOf('karton.xlsx', 4096, 1_700_000_009_999);
    expect(fileIdentity(before)).not.toBe(fileIdentity(after));
  });

  it('survives a round trip through storage, which a File does not', () => {
    const identity = fileIdentity(fileOf('karton.xlsx', 4096, 1_700_000_000_000));
    expect(JSON.parse(JSON.stringify({ identity })).identity).toBe(identity);
  });
});
