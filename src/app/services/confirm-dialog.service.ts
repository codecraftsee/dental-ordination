import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog';
import { TranslateService } from './translate.service';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private dialog = inject(MatDialog);
  private translateService = inject(TranslateService);

  confirm(
    titleKey: string,
    messageKey: string,
    options?: { icon?: string; iconColor?: 'danger' | 'warning' },
  ): Observable<boolean> {
    const data: ConfirmDialogData = {
      title: this.translateService.translate(titleKey),
      message: this.translateService.translate(messageKey),
      icon: options?.icon,
      iconColor: options?.iconColor,
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
