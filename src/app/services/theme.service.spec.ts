import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

/**
 * ThemeService only reads `.matches`, but the stub replaces a window global that
 * outlives this file, and Angular CDK calls `addListener` on whatever it finds.
 * A `{ matches }` literal is why CI failed with "mql.addListener is not a
 * function" from an unrelated spec. test-setup.ts now restores the shim after
 * every test; keeping the stub complete means it is also valid while in use.
 */
function stubMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      matches,
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    stubMatchMedia(false);
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
    stubMatchMedia(true);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });
});
