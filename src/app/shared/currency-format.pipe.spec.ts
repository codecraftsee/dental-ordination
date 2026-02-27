import { CurrencyFormatPipe } from './currency-format.pipe';

describe('CurrencyFormatPipe', () => {
  let pipe: CurrencyFormatPipe;

  beforeEach(() => {
    pipe = new CurrencyFormatPipe();
  });

  it('returns empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('formats zero with RSD suffix', () => {
    expect(pipe.transform(0)).toContain('RSD');
  });

  it('formats a number and appends RSD', () => {
    const result = pipe.transform(1500);
    expect(result).toContain('RSD');
    expect(result).toContain('1');
  });

  it('includes the numeric value in output', () => {
    const result = pipe.transform(42);
    expect(result).toContain('42');
    expect(result.endsWith('RSD')).toBe(true);
  });
});
