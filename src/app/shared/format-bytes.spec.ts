import { formatBytes } from './format-bytes';

describe('formatBytes', () => {
  it('formats across units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(2_400_000)).toBe('2.3 MB');
    expect(formatBytes(80 * 1024 * 1024)).toBe('80.0 MB');
  });

  it('shows whole bytes but one decimal above', () => {
    expect(formatBytes(999)).toBe('999 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('caps at GB rather than inventing a larger unit', () => {
    expect(formatBytes(5 * 1024 ** 4)).toBe('5120.0 GB');
  });
});
