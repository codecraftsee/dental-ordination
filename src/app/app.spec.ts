import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { TranslateService } from './services/translate.service';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  const mockAuthService = {
    isAuthenticated: signal(false),
    logout: vi.fn(),
  };

  const mockTranslateService = {
    translate: (key: string) => key,
    instant: (key: string) => key,
    version: signal('en'),
    currentLang: signal('en'),
    setLanguage: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('creates the app', () => {
    expect(component).toBeTruthy();
  });

  it('sidenavOpen defaults to true on desktop (wide window)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1200 });
    expect(component.sidenavOpen()).toBe(true);
  });

  it('toggleSidenav flips sidenavOpen', () => {
    const before = component.sidenavOpen();
    component.toggleSidenav();
    expect(component.sidenavOpen()).toBe(!before);
  });

  it('toggleSidenav twice returns to original state', () => {
    const original = component.sidenavOpen();
    component.toggleSidenav();
    component.toggleSidenav();
    expect(component.sidenavOpen()).toBe(original);
  });

  it('onResize sets isMobile to true for narrow widths', () => {
    component.onResize({ target: { innerWidth: 500 } } as unknown as UIEvent);
    expect(component.isMobile()).toBe(true);
  });

  it('onResize sets isMobile to false for wide widths', () => {
    component.onResize({ target: { innerWidth: 1024 } } as unknown as UIEvent);
    expect(component.isMobile()).toBe(false);
  });

  it('onResize closes sidenav when switching to mobile', () => {
    component.sidenavOpen.set(true);
    component.onResize({ target: { innerWidth: 400 } } as unknown as UIEvent);
    expect(component.sidenavOpen()).toBe(false);
  });

  it('logout delegates to authService', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
