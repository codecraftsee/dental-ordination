import { TestBed } from '@angular/core/testing';
import { TranslateService } from './translate.service';

const mockTranslations = { 'common.save': 'Save', 'nav.home': 'Home' };

describe('TranslateService', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockTranslations),
    } as Response);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the key when translation is not yet loaded', () => {
    const service = TestBed.inject(TranslateService);
    expect(service.translate('missing.key')).toBe('missing.key');
  });

  it('instant() behaves the same as translate()', () => {
    const service = TestBed.inject(TranslateService);
    expect(service.instant('some.key')).toBe('some.key');
  });

  it('defaults to "en" when no language is stored', () => {
    const service = TestBed.inject(TranslateService);
    expect(service.currentLang()).toBe('en');
  });

  it('reads saved language from localStorage', () => {
    localStorage.setItem('dental-ordination-lang', 'sr');
    const service = TestBed.inject(TranslateService);
    expect(service.currentLang()).toBe('sr');
  });

  it('setLanguage updates currentLang and persists to localStorage', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('sr');
    expect(service.currentLang()).toBe('sr');
    expect(localStorage.getItem('dental-ordination-lang')).toBe('sr');
  });

  it('translate returns value after translations load', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('en');
    expect(service.translate('common.save')).toBe('Save');
  });
});
