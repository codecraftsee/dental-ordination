import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslatePipe } from './translate.pipe';
import { TranslateService } from '../services/translate.service';

describe('TranslatePipe', () => {
  const mockTranslations: Record<string, string> = {
    'common.save': 'Save',
    'nav.home': 'Home',
    'home.importingFilesCount_one': '1 file',
    'home.importingFilesCount_other': '{count} files',
  };
  const mockTranslateService = {
    version: signal('en'),
    translate: (key: string) => mockTranslations[key] ?? key,
    translatePlural: (baseKey: string, count: number) => {
      const category = new Intl.PluralRules('en').select(count);
      const value =
        mockTranslations[`${baseKey}_${category}`] ??
        mockTranslations[`${baseKey}_other`] ??
        mockTranslations[baseKey] ??
        baseKey;
      return value.replace('{count}', String(count));
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: mockTranslateService }],
    });
  });

  it('translates a known key', () => {
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe.transform('common.save')).toBe('Save');
  });

  it('returns the key itself when translation is missing', () => {
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe.transform('missing.key')).toBe('missing.key');
  });

  it('uses plural "one" form when count is 1', () => {
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe.transform('home.importingFilesCount', { count: 1 })).toBe('1 file');
  });

  it('uses plural "other" form with substituted count when count is > 1', () => {
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe.transform('home.importingFilesCount', { count: 5 })).toBe('5 files');
  });
});
