/**
 * Coarse, human-readable duration: 42s, 3m 07s, 1h 12m.
 *
 * Deliberately two units at most. An import runs for tens of minutes and the
 * numbers are estimates, so second-level precision on an hour-long remaining
 * time is noise dressed up as accuracy.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0s';

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}
