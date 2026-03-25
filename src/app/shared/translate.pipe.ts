import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '../services/translate.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private translateService = inject(TranslateService);

  transform(key: string, params?: { count?: number }): string {
    this.translateService.version();
    if (params?.count !== undefined) {
      return this.translateService.translatePlural(key, params.count);
    }
    return this.translateService.translate(key);
  }
}
