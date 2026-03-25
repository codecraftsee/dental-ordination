import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { ConfirmDialogService } from './confirm-dialog.service';
import { TranslateService } from './translate.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let afterClosedSubject: Subject<boolean | undefined>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    afterClosedSubject = new Subject<boolean | undefined>();
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => afterClosedSubject.asObservable() }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: TranslateService,
          useValue: { translate: (key: string) => `translated:${key}` },
        },
      ],
    });

    service = TestBed.inject(ConfirmDialogService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('opens the dialog with translated title and message', () => {
    service.confirm('some.titleKey', 'some.messageKey').subscribe();

    expect(mockDialog.open).toHaveBeenCalledOnce();
    const [, config] = mockDialog.open.mock.calls[0];
    expect(config.data.title).toBe('translated:some.titleKey');
    expect(config.data.message).toBe('translated:some.messageKey');
  });

  it('emits true when dialog closes with true', () => {
    let result: boolean | undefined;
    service.confirm('t', 'm').subscribe(v => (result = v));
    afterClosedSubject.next(true);
    afterClosedSubject.complete();
    expect(result).toBe(true);
  });

  it('emits false when dialog closes with undefined (No button)', () => {
    let result: boolean | undefined;
    service.confirm('t', 'm').subscribe(v => (result = v));
    afterClosedSubject.next(undefined);
    afterClosedSubject.complete();
    expect(result).toBe(false);
  });

  it('emits false when dialog closes with false', () => {
    let result: boolean | undefined;
    service.confirm('t', 'm').subscribe(v => (result = v));
    afterClosedSubject.next(false);
    afterClosedSubject.complete();
    expect(result).toBe(false);
  });
});
