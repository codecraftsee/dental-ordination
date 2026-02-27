import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    TestBed.configureTestingModule({});
  });

  it('initialises with light theme when localStorage is empty and OS is light', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('reads dark theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('reads light theme from localStorage', () => {
    localStorage.setItem('theme', 'light');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
  });

  it('toggleTheme switches from light to dark', () => {
    localStorage.setItem('theme', 'light');
    const service = TestBed.inject(ThemeService);
    service.toggleTheme();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('toggleTheme switches from dark to light', () => {
    localStorage.setItem('theme', 'dark');
    const service = TestBed.inject(ThemeService);
    service.toggleTheme();
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('uses OS dark preference when no localStorage value exists', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });
});
