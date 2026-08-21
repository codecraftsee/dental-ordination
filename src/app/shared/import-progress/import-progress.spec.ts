import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { WritableSignal, computed, signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ImportProgress } from './import-progress';
import { TranslateService } from '../../services/translate.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { PatientImportService } from '../../services/patient-import.service';
import { ImportRunState, ImportRunTallies, emptyTallies } from '../../models/import-run.model';

/** The slice of the run the panel actually reads. */
interface RunStub {
  state: WritableSignal<ImportRunState>;
  progress: WritableSignal<number>;
  currentFile: WritableSignal<string>;
  processed: WritableSignal<number>;
  total: WritableSignal<number>;
  batchIndex: WritableSignal<number>;
  batchCount: WritableSignal<number>;
  tallies: WritableSignal<ImportRunTallies>;
  message: WritableSignal<string>;
  error: WritableSignal<boolean>;
  elapsedMs: WritableSignal<number>;
  etaMs: WritableSignal<number | null>;
  filesPerMinute: WritableSignal<number>;
  canResume: WritableSignal<boolean>;
}

describe('ImportProgress', () => {
  let component: ImportProgress;
  let fixture: ComponentFixture<ImportProgress>;
  let run: RunStub;
  let cancel: ReturnType<typeof vi.fn>;
  let resume: ReturnType<typeof vi.fn>;
  let dismiss: ReturnType<typeof vi.fn>;
  let confirm: ReturnType<typeof vi.fn>;

  const text = () => fixture.nativeElement.textContent as string;
  const query = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement | null;

  beforeEach(async () => {
    run = {
      state: signal<ImportRunState>('processing'),
      progress: signal(42),
      currentFile: signal('card7.xlsx'),
      processed: signal(3412),
      total: signal(8140),
      batchIndex: signal(7),
      batchCount: signal(163),
      tallies: signal<ImportRunTallies>({ ...emptyTallies(), patientsCreated: 12, visitsCreated: 90, visitsSkipped: 4, filesFailed: 2 }),
      message: signal(''),
      error: signal(false),
      elapsedMs: signal(125_000),
      etaMs: signal(600_000),
      filesPerMinute: signal(37.4),
      canResume: signal(false),
    };
    cancel = vi.fn();
    resume = vi.fn();
    dismiss = vi.fn();
    confirm = vi.fn().mockReturnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [ImportProgress],
      providers: [
        provideAnimations(),
        {
          provide: PatientImportService,
          useValue: {
            ...run,
            importing: computed(() => {
              const state = run.state();
              return state === 'uploading' || state === 'processing' || state === 'cancelling';
            }),
            cancel,
            resume,
            dismiss,
          },
        },
        { provide: ConfirmDialogService, useValue: { confirm } },
        {
          provide: TranslateService,
          useValue: {
            version: signal(0),
            translate: (key: string) => key,
            translatePlural: (key: string) => key,
            instant: (key: string) => key,
            // Keeps the interpolated values visible so tests can assert them.
            format: (key: string, params: Record<string, string | number>) =>
              `${key}|${Object.values(params).join(',')}`,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders nothing while idle', () => {
    run.state.set('idle');
    fixture.detectChanges();

    expect(query('.import-panel')).toBeNull();
  });

  it('shows the progress bar, counter and current file during a run', () => {
    expect(query('.import-panel')).not.toBeNull();
    expect(query('mat-progress-bar')).not.toBeNull();
    expect(text()).toContain('import.fileCounter|3412,8140');
    expect(text()).toContain('card7.xlsx');
    expect(text()).toContain('42%');
  });

  /**
   * The upload leg reports no progress at all — `fetch` cannot observe upload
   * bytes — so the panel has to say what is happening or the still bar reads as
   * a hang.
   */
  it('names which upload is in flight while uploading', () => {
    run.state.set('uploading');
    fixture.detectChanges();

    expect(text()).toContain('import.phaseUploading|7,163');
  });

  it('shows elapsed, remaining and throughput while running', () => {
    expect(text()).toContain('2m 05s');
    expect(text()).toContain('10m 00s');
    expect(text()).toContain('import.rate|37');
  });

  it('shows an em dash for remaining time before a rate is known', () => {
    run.etaMs.set(null);
    fixture.detectChanges();

    expect(text()).toContain('—');
  });

  it('shows the live tallies, including the ones nothing used to surface', () => {
    expect(text()).toContain('12');
    expect(text()).toContain('90');
    expect(query('.import-panel__tally--failed')?.textContent).toContain('2');
  });

  describe('collapsing', () => {
    it('collapses to a pill showing the percentage', () => {
      component.toggleCollapsed();
      fixture.detectChanges();

      expect(query('.import-panel__pill')).not.toBeNull();
      expect(query('mat-progress-bar')).toBeNull();
      expect(text()).toContain('42%');
    });

    it('expands again from the pill', () => {
      component.toggleCollapsed();
      fixture.detectChanges();
      query('.import-panel__pill')?.click();
      fixture.detectChanges();

      expect(query('.import-panel__pill')).toBeNull();
      expect(query('mat-progress-bar')).not.toBeNull();
    });
  });

  describe('dismissing', () => {
    /** A job with an hour left must not be closable into invisibility. */
    it('offers no dismiss while the run is going', () => {
      expect(query('button[aria-label="import.dismiss"]')).toBeNull();
    });

    it('offers dismiss once the run is over', () => {
      run.state.set('completed');
      fixture.detectChanges();

      query('button[aria-label="import.dismiss"]')?.click();

      expect(dismiss).toHaveBeenCalled();
    });
  });

  describe('cancelling', () => {
    it('confirms before stopping', () => {
      query('.import-panel__stop')?.click();

      expect(confirm).toHaveBeenCalledWith('import.cancelTitle', 'import.cancelMessage', {
        icon: 'stop_circle',
        iconColor: 'warning',
      });
      expect(cancel).toHaveBeenCalled();
    });

    it('does not stop when the confirmation is declined', () => {
      confirm.mockReturnValue(of(false));

      query('.import-panel__stop')?.click();

      expect(cancel).not.toHaveBeenCalled();
    });

    it('offers no stop button once the run is over', () => {
      run.state.set('stopped');
      fixture.detectChanges();

      expect(query('.import-panel__stop')).toBeNull();
    });

    it('disables the stop button while already stopping', () => {
      run.state.set('cancelling');
      fixture.detectChanges();

      expect(query('.import-panel__stop')?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('resuming', () => {
    it('offers resume when work is outstanding', () => {
      run.state.set('stopped');
      run.canResume.set(true);
      fixture.detectChanges();

      query('.import-panel__actions button')?.click();

      expect(resume).toHaveBeenCalled();
    });

    it('offers nothing to resume when everything landed', () => {
      run.state.set('completed');
      run.canResume.set(false);
      fixture.detectChanges();

      expect(query('.import-panel__actions button')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('labels the panel as a region', () => {
      expect(query('.import-panel')?.getAttribute('role')).toBe('region');
      expect(query('.import-panel')?.getAttribute('aria-label')).toBe('import.panelTitle');
    });

    /**
     * The visible numbers change once per file — thousands of times on a real
     * migration — so the live region deliberately carries only "a run is going"
     * and, at the end, the outcome.
     */
    it('announces the run once, not once per file', () => {
      const region = query('.import-panel__announcement');
      expect(region?.getAttribute('aria-live')).toBe('polite');
      expect(region?.textContent?.trim()).toBe('import.announceStarted');

      run.processed.set(3413);
      run.currentFile.set('card8.xlsx');
      fixture.detectChanges();

      expect(region?.textContent?.trim()).toBe('import.announceStarted');
    });

    it('announces the outcome when the run ends', () => {
      run.state.set('completed');
      run.message.set('Imported 8,140 files');
      fixture.detectChanges();

      expect(query('.import-panel__announcement')?.textContent).toContain('Imported 8,140 files');
    });

    it('announces a failure assertively', () => {
      run.state.set('failed');
      run.error.set(true);
      run.message.set('Import failed');
      fixture.detectChanges();

      expect(query('.import-panel__announcement')?.getAttribute('aria-live')).toBe('assertive');
    });

    it('gives the collapsed pill an accessible name and expanded state', () => {
      component.toggleCollapsed();
      fixture.detectChanges();

      const pill = query('.import-panel__pill');
      expect(pill?.getAttribute('aria-label')).toBe('import.expand');
      expect(pill?.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
