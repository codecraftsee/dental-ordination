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
    user: signal(null),
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

  it('sidenavOpen starts closed — it is the mobile overlay, not the desktop sidebar', () => {
    expect(component.sidenavOpen()).toBe(false);
  });

  it('toggleSidenav opens then closes the overlay on mobile', () => {
    component.onResize({ target: { innerWidth: 500 } } as unknown as UIEvent);

    component.toggleSidenav();
    expect(component.sidenavOpen()).toBe(true);

    component.toggleSidenav();
    expect(component.sidenavOpen()).toBe(false);
  });

  it('toggleSidenav collapses the sidebar on desktop and leaves the overlay alone', () => {
    component.onResize({ target: { innerWidth: 1024 } } as unknown as UIEvent);

    // Relative to the current value: loadCollapsedState reads localStorage,
    // which earlier toggles in this file have already written to.
    const before = component.sidebarCollapsed();
    component.toggleSidenav();

    expect(component.sidebarCollapsed()).toBe(!before);
    expect(component.sidenavOpen()).toBe(false);
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
