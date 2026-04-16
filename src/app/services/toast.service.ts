import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from './translate.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);
  private translateService = inject(TranslateService);

  success(translationKey: string): void {
    this.snackBar.open(this.translateService.instant(translationKey), '', {
      duration: 3000,
      panelClass: 'toast-success',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(error: unknown): void {
    const message = this.extractErrorMessage(error);
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: 'toast-error',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.translateService.instant('toast.unknownError');
    }

    const body = error.error;

    // FastAPI validation error: { detail: [{ msg: "..." }, ...] }
    if (body?.detail && Array.isArray(body.detail)) {
      return body.detail.map((e: { msg: string }) => e.msg).join('; ');
    }

    // FastAPI string error: { detail: "some message" }
    if (typeof body?.detail === 'string') {
      return body.detail;
    }

    // Plain string body
    if (typeof body === 'string') {
      return body;
    }

    return this.translateService.instant('toast.unknownError');
  }
}
