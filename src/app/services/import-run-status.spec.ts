import { TestBed } from '@angular/core/testing';
import { ImportRunStatus } from './import-run-status';

describe('ImportRunStatus', () => {
  let status: ImportRunStatus;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    status = TestBed.inject(ImportRunStatus);
  });

  it('starts idle, with nothing to show', () => {
    expect(status.state()).toBe('idle');
    expect(status.running()).toBe(false);
    expect(status.visible()).toBe(false);
  });

  /** These three are the phases a tab close would destroy work in. */
  it('counts uploading, processing and cancelling as running', () => {
    for (const state of ['uploading', 'processing', 'cancelling'] as const) {
      status.set(state);
      expect(status.running()).toBe(true);
    }
  });

  it('does not count a finished run as running', () => {
    for (const state of ['stopped', 'completed', 'failed'] as const) {
      status.set(state);
      expect(status.running()).toBe(false);
    }
  });

  /**
   * A terminal run still has a panel to show — the summary is the whole point of
   * having run it — so `visible` outlasts `running`.
   */
  it('keeps a finished run visible until it is dismissed', () => {
    status.set('completed');
    expect(status.visible()).toBe(true);

    status.set('idle');
    expect(status.visible()).toBe(false);
  });
});
