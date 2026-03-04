import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LocalizedDatePipe } from './localized-date.pipe';
import { TranslateService } from '../services/translate.service';

describe('LocalizedDatePipe', () => {
  const createPipe = (lang: 'en' | 'sr') => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: { currentLang: signal(lang) },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new LocalizedDatePipe());
  };

  it('returns empty string for empty value', () => {
    const pipe = createPipe('en');
    expect(pipe.transform('')).toBe('');
  });

  it('formats a date string with the given format', () => {
    const pipe = createPipe('en');
    const result = pipe.transform('2024-03-15', 'dd/MM/yyyy');
    expect(result).toContain('15');
    expect(result).toContain('03');
    expect(result).toContain('2024');
  });

  it('uses Serbian locale when language is sr', () => {
    const pipe = createPipe('sr');
    const result = pipe.transform('2024-03-15', 'dd/MM/yyyy');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('uses default format when no format is provided', () => {
    const pipe = createPipe('en');
    const result = pipe.transform('2024-03-15');
    expect(result).toBeTruthy();
    expect(result).toContain('2024');
  });
});
