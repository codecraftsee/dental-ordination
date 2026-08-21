import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from './shared/translate.pipe';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';
import { Sidebar } from './shared/sidebar/sidebar';
import { ImportProgress } from './shared/import-progress/import-progress';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { ImportRunStatus } from './services/import-run-status';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    TranslatePipe,
    LanguageSwitcher,
    Sidebar,
    ImportProgress,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize($event)',
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class App {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly importStatus = inject(ImportRunStatus);

  readonly isMobile = signal(window.innerWidth < 768);

  readonly userDisplayName = computed(() => {
    const user = this.authService.user();
    if (!user) return '';
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  });

  /** Desktop: sidebar is always visible, this controls mini vs full width. */
  readonly sidebarCollapsed = signal(this.loadCollapsedState());

  /** Mobile only: controls whether the overlay sidenav is open. */
  readonly sidenavOpen = signal(false);

  constructor() {
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');

    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => {
      if (this.isMobile()) {
        this.sidenavOpen.set(false);
      }
    });
  }

  /**
   * The only thing that actually destroys a running import.
   *
   * Router navigation is harmless — the run lives in a root-provided service and
   * the progress panel follows the user across routes — so guarding the router
   * would lock the app for an hour to prevent nothing. Closing or reloading the
   * tab kills the `fetch` outright, and `beforeunload` is the only place that
   * can be intercepted.
   */
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.importStatus.running()) return;
    event.preventDefault();
    // Still required by browsers that predate preventDefault() being enough.
    // The string is never shown; they render their own wording.
    event.returnValue = '';
  }

  onResize(event: UIEvent): void {
    const mobile = (event.target as Window).innerWidth < 768;
    this.isMobile.set(mobile);
    if (mobile) {
      this.sidenavOpen.set(false);
    }
  }

  toggleSidenav(): void {
    if (this.isMobile()) {
      this.sidenavOpen.update(v => !v);
    } else {
      const next = !this.sidebarCollapsed();
      this.sidebarCollapsed.set(next);
      localStorage.setItem('sidebar-collapsed', String(next));
    }
  }

  logout(): void {
    this.authService.logout();
  }

  private loadCollapsedState(): boolean {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  }
}
