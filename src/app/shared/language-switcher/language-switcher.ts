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
      background: var(--color-surface-variant);
      border: 1px solid var(--color-border);
      color: var(--color-navbar-text);
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
        background: var(--color-primary);
        color: #fff;
        border-color: var(--color-primary);
      }

      &.active {
        background: var(--color-primary);
        color: #fff;
        border-color: var(--color-primary);
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
