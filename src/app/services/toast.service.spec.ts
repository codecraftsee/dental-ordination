import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';
import { TranslateService } from './translate.service';

describe('ToastService', () => {
  let service: ToastService;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let translateService: { instant: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBar = { open: vi.fn() };
    translateService = { instant: vi.fn((key: string) => key) };

    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackBar },
        { provide: TranslateService, useValue: translateService },
      ],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success toast with translated message', () => {
    service.success('toast.patientCreated');
    expect(translateService.instant).toHaveBeenCalledWith('toast.patientCreated');
    expect(snackBar.open).toHaveBeenCalledWith('toast.patientCreated', '', expect.objectContaining({
      duration: 3000,
      panelClass: 'toast-success',
    }));
  });

  it('should show error toast with FastAPI validation detail', () => {
    const error = new HttpErrorResponse({
      error: { detail: [{ msg: 'Input should be ADMIN' }] },
      status: 422,
    });
    service.error(error);
    expect(snackBar.open).toHaveBeenCalledWith('Input should be ADMIN', '', expect.objectContaining({
      panelClass: 'toast-error',
    }));
  });

  it('should show error toast with string detail', () => {
    const error = new HttpErrorResponse({
      error: { detail: 'Not found' },
      status: 404,
    });
    service.error(error);
    expect(snackBar.open).toHaveBeenCalledWith('Not found', '', expect.objectContaining({
      panelClass: 'toast-error',
    }));
  });

  it('should fall back to unknown error for non-HTTP errors', () => {
    service.error(new Error('something'));
    expect(translateService.instant).toHaveBeenCalledWith('toast.unknownError');
  });
});
