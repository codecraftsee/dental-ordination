import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { TranslateService } from '../services/translate.service';

@Pipe({
  name: 'localizedDate',
  pure: false,
})
export class LocalizedDatePipe implements PipeTransform {
  private translateService = inject(TranslateService);

  transform(value: string | Date, format = 'longDate'): string {
    if (!value) return '';
    const locale = this.translateService.currentLang() === 'sr' ? 'sr-Latn' : 'en-US';
    return formatDate(value, format, locale);
  }
}
