import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'en' | 'sr';

const STORAGE_KEY = 'dental-ordination-lang';

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly translations = signal<Record<string, string>>({});
  readonly currentLang = signal<Lang>(this.detectLanguage());

  readonly version = computed(() => {
    this.translations();
    return this.currentLang();
  });

  constructor() {
    this.loadTranslations(this.currentLang());
  }

  async setLanguage(lang: Lang): Promise<void> {
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    await this.loadTranslations(lang);
  }

  translate(key: string): string {
    return this.translations()[key] || key;
  }

  instant(key: string): string {
    return this.translate(key);
  }

  private detectLanguage(): Lang {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'sr') return stored;
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('sr')) return 'sr';
    return 'en';
  }

  private async loadTranslations(lang: Lang): Promise<void> {
    try {
      const baseUri = document.baseURI;
      const response = await fetch(`${baseUri}i18n/${lang}.json`);
      const data = await response.json();
      this.translations.set(data);
    } catch {
      console.error(`Failed to load translations for ${lang}`);
    }
  }
}
