import { Injectable, signal } from '@angular/core';
import { StoredRunManifest, StoredRunReport } from '../models/import-run.model';

const MANIFEST_KEY = 'import.run.manifest';
const REPORT_KEY = 'import.run.report';

/**
 * Rows kept in the persisted report. A run where thousands of files fail is a
 * broken configuration, not a list worth reading to the end, and the counts
 * still tell the whole story. `attentionTruncated` says when the cap bit, so the
 * UI never implies it is showing everything.
 */
export const MAX_STORED_ATTENTION_ROWS = 2000;

/**
 * What survives a page reload between import runs.
 *
 * A run itself cannot: the `fetch` dies with the tab. What can survive is
 * knowing *where it stopped* — so a re-picked folder skips whatever already
 * landed — and *what went wrong*, so a refresh does not lose the failure list.
 *
 * Everything here degrades rather than throws. Storage that is full, disabled,
 * or holding a payload from an older shape must not be able to take down an
 * import that is otherwise working perfectly.
 */
@Injectable({ providedIn: 'root' })
export class ImportRunStore {
  /** Set once a write has failed, so the UI can stop promising resume. */
  private readonly _degraded = signal(false);
  readonly degraded = this._degraded.asReadonly();

  readManifest(): StoredRunManifest | null {
    const raw = this.read(MANIFEST_KEY);
    if (!raw || !isManifest(raw)) {
      if (raw) this.remove(MANIFEST_KEY);
      return null;
    }
    return raw;
  }

  writeManifest(manifest: StoredRunManifest): void {
    this.write(MANIFEST_KEY, manifest);
  }

  clearManifest(): void {
    this.remove(MANIFEST_KEY);
  }

  readReport(): StoredRunReport | null {
    const raw = this.read(REPORT_KEY);
    if (!raw || !isReport(raw)) {
      if (raw) this.remove(REPORT_KEY);
      return null;
    }
    return raw;
  }

  writeReport(report: StoredRunReport): void {
    const attention = report.attention.slice(0, MAX_STORED_ATTENTION_ROWS);
    this.write(REPORT_KEY, {
      ...report,
      attention,
      attentionTruncated: report.attention.length > attention.length,
    });
  }

  clearReport(): void {
    this.remove(REPORT_KEY);
  }

  private read(key: string): unknown {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Unparseable or unreadable. Treat as absent; the caller drops the key.
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Almost always the quota. Drop what we were trying to keep rather than
      // leave a half-written manifest that resume would trust, and record that
      // persistence is no longer reliable.
      this._degraded.set(true);
      this.remove(key);
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing left to do; the getters validate whatever they find anyway.
    }
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isManifest(value: unknown): value is StoredRunManifest {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Partial<StoredRunManifest>;
  return (
    isStringArray(m.doneIdentities) &&
    typeof m.total === 'number' &&
    typeof m.startedAt === 'number' &&
    (m.doctorId === undefined || typeof m.doctorId === 'string')
  );
}

function isReport(value: unknown): value is StoredRunReport {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Partial<StoredRunReport>;
  return (
    typeof r.finishedAt === 'number' &&
    typeof r.total === 'number' &&
    typeof r.processed === 'number' &&
    typeof r.state === 'string' &&
    typeof r.tallies === 'object' &&
    r.tallies !== null &&
    Array.isArray(r.attention)
  );
}
