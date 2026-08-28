import { TestBed } from '@angular/core/testing';
import { TranslateService } from './translate.service';

const mockTranslations = {
  'common.save': 'Save',
  'nav.home': 'Home',
  'home.importingFilesCount_one': '1 file',
  'home.importingFilesCount_other': '{count} files',
  'home.importingFilesCount_few': '{count} fajla',
  'home.importSummary': 'Imported {filesProcessed} file(s): {patientsCreated} new patient(s), {visitsCreated} visit(s).',
  'home.importFailed': 'Import failed: {detail}',
};

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

  it('translatePlural returns singular form for count 1', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('en');
    expect(service.translatePlural('home.importingFilesCount', 1)).toBe('1 file');
  });

  it('translatePlural returns plural form with count substituted', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('en');
    expect(service.translatePlural('home.importingFilesCount', 5)).toBe('5 files');
  });

  // Serbian has a third plural category, `few`, for 2-4 (and 22-24, 32-34...) that
  // English does not. The category comes from Intl.PluralRules rather than a
  // hand-rolled one/other split, so `sr.json`'s `_few` key is live — these lock that
  // in, since a regression here is silent: it just picks the `_other` wording.
  it('translatePlural selects the Serbian few form for 2-4', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('sr');
    expect(service.translatePlural('home.importingFilesCount', 2)).toBe('2 fajla');
    expect(service.translatePlural('home.importingFilesCount', 4)).toBe('4 fajla');
    expect(service.translatePlural('home.importingFilesCount', 22)).toBe('22 fajla');
  });

  it('translatePlural keeps one and other distinct in Serbian', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('sr');
    expect(service.translatePlural('home.importingFilesCount', 1)).toBe('1 file');
    expect(service.translatePlural('home.importingFilesCount', 21)).toBe('1 file');
    expect(service.translatePlural('home.importingFilesCount', 5)).toBe('5 files');
  });

  it('translatePlural falls back to _other when the language has no such category', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('en');
    expect(service.translatePlural('home.importingFilesCount', 2)).toBe('2 files');
  });

  it('translatePlural falls back to baseKey when no variant found', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('en');
    expect(service.translatePlural('missing.key', 3)).toBe('missing.key');
  });

  it('format substitutes all named placeholders', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('en');
    expect(
      service.format('home.importSummary', { filesProcessed: 2, patientsCreated: 1, visitsCreated: 5 }),
    ).toBe('Imported 2 file(s): 1 new patient(s), 5 visit(s).');
  });

  it('format falls back to key when translation is missing', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('en');
    expect(service.format('missing.key', { foo: 'bar' })).toBe('missing.key');
  });

  /**
   * The file keeps one URL across every release while the bundles are
   * content-hashed, so a cached copy would answer with the strings from before
   * the last deploy and every key added since would render as its own key.
   */
  it('revalidates the translation file instead of reusing a cached copy', async () => {
    const service = TestBed.inject(TranslateService);
    await service.setLanguage('sr');

    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    for (const [url, init] of calls) {
      expect(url).toContain('i18n/');
      expect((init as RequestInit | undefined)?.cache).toBe('no-cache');
    }
  });
});
