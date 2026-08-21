import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { TranslateService } from './services/translate.service';
import { ImportRunStatus } from './services/import-run-status';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  const mockImportStatus = { running: signal(false), visible: signal(false) };

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
        { provide: ImportRunStatus, useValue: mockImportStatus },
      ],
    }).compileComponents();

    mockImportStatus.running.set(false);

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

  /**
   * Closing or reloading the tab is the one thing that actually destroys a
   * running import — router navigation is harmless, because the run lives in a
   * root-provided service and the progress panel follows the user across routes.
   */
  describe('leaving the page during an import', () => {
    const unloadEvent = () => {
      const event = {
        preventDefault: vi.fn(),
        returnValue: undefined as unknown as string,
      };
      return event as unknown as BeforeUnloadEvent & { preventDefault: ReturnType<typeof vi.fn> };
    };

    it('prompts while an import is running', () => {
      mockImportStatus.running.set(true);
      const event = unloadEvent();

      component.onBeforeUnload(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.returnValue).toBe('');
    });

    it('does not prompt when nothing is running', () => {
      const event = unloadEvent();

      component.onBeforeUnload(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
