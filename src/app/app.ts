import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { TranslatePipe } from './shared/translate.pipe';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';
import { Sidebar } from './shared/sidebar/sidebar';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TranslatePipe,
    LanguageSwitcher,
    Sidebar,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize($event)',
  },
})
export class App {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  readonly isMobile = signal(window.innerWidth < 768);

  /** Desktop: sidebar is always visible, this controls mini vs full width. */
  readonly sidebarCollapsed = signal(this.loadCollapsedState());

  /** Mobile only: controls whether the overlay sidenav is open. */
  readonly sidenavOpen = signal(false);

  constructor() {
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');

    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => {
      if (this.isMobile()) {
        this.sidenavOpen.set(false);
      }
    });
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
