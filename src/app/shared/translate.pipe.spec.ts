import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslatePipe } from './translate.pipe';
import { TranslateService } from '../services/translate.service';

describe('TranslatePipe', () => {
  const mockTranslations: Record<string, string> = {
    'common.save': 'Save',
    'nav.home': 'Home',
  };
  const mockTranslateService = {
    version: signal('en'),
    translate: (key: string) => mockTranslations[key] ?? key,
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
});
