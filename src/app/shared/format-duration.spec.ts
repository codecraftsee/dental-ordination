import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it('shows seconds under a minute', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(9_400)).toBe('9s');
    expect(formatDuration(59_000)).toBe('59s');
  });

  it('shows minutes and padded seconds', () => {
    expect(formatDuration(60_000)).toBe('1m 00s');
    expect(formatDuration(125_000)).toBe('2m 05s');
    expect(formatDuration(3_599_000)).toBe('59m 59s');
  });

  /** Seconds on an hour-long estimate are noise dressed up as accuracy. */
  it('drops to hours and minutes past an hour', () => {
    expect(formatDuration(3_600_000)).toBe('1h 00m');
    expect(formatDuration(4_335_000)).toBe('1h 12m');
  });

  it('rounds to the nearest second', () => {
    expect(formatDuration(1_600)).toBe('2s');
  });

  it('does not produce nonsense for missing or negative input', () => {
    expect(formatDuration(-1)).toBe('0s');
    expect(formatDuration(Number.NaN)).toBe('0s');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0s');
  });
});
