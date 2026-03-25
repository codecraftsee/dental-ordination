import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog';
import { TranslateService } from './translate.service';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private dialog = inject(MatDialog);
  private translateService = inject(TranslateService);

  confirm(titleKey: string, messageKey: string): Observable<boolean> {
    const data: ConfirmDialogData = {
      title: this.translateService.translate(titleKey),
      message: this.translateService.translate(messageKey),
    };

    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data,
        width: '400px',
        disableClose: true,
        autoFocus: false,
      })
      .afterClosed()
      .pipe(map(result => result === true));
  }
}
