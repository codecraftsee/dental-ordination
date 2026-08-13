import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { LanguageSwitcher } from './language-switcher';
import { TranslateService, Lang } from '../../services/translate.service';

describe('LanguageSwitcher', () => {
  let fixture: ComponentFixture<LanguageSwitcher>;
  let setLanguage: ReturnType<typeof vi.fn>;
  let currentLang: ReturnType<typeof signal<Lang>>;

  beforeEach(async () => {
    setLanguage = vi.fn();
    currentLang = signal<Lang>('en');

    await TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: { setLanguage, currentLang } }],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcher);
    fixture.detectChanges();
  });

  function buttons(): HTMLButtonElement[] {
    return fixture.debugElement.queryAll(By.css('.lang-btn')).map(d => d.nativeElement);
  }

  it('renders a button per supported language', () => {
    expect(buttons().map(b => b.textContent?.trim())).toEqual(['EN', 'SR']);
  });

  it('marks the current language active', () => {
    const [en, sr] = buttons();
    expect(en.classList.contains('active')).toBe(true);
    expect(sr.classList.contains('active')).toBe(false);
  });

  it('follows the service when the language changes elsewhere', () => {
    currentLang.set('sr');
    fixture.detectChanges();

    const [en, sr] = buttons();
    expect(en.classList.contains('active')).toBe(false);
    expect(sr.classList.contains('active')).toBe(true);
  });

  it('switches the language on click', () => {
    buttons()[1].click();
    expect(setLanguage).toHaveBeenCalledWith('sr');

    buttons()[0].click();
    expect(setLanguage).toHaveBeenCalledWith('en');
  });

  it('setLang delegates straight to the service', () => {
    fixture.componentInstance.setLang('sr');
    expect(setLanguage).toHaveBeenCalledWith('sr');
  });
});
