import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService, Lang } from '../../services/translate.service';

@Component({
  selector: 'app-language-switcher',
  template: `
    <div class="lang-switcher">
      <button
        class="lang-btn"
        [class.active]="translateService.currentLang() === 'en'"
        (click)="setLang('en')"
      >EN</button>
      <button
        class="lang-btn"
        [class.active]="translateService.currentLang() === 'sr'"
        (click)="setLang('sr')"
      >SR</button>
    </div>
  `,
  styles: [`
    .lang-switcher {
      display: flex;
      gap: 2px;
      margin-left: 8px;
    }

    .lang-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.7);
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:first-child {
        border-radius: 4px 0 0 4px;
      }

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }

      &.active {
        background: rgba(255, 255, 255, 0.25);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.4);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  protected translateService = inject(TranslateService);

  setLang(lang: Lang): void {
    this.translateService.setLanguage(lang);
  }
}
