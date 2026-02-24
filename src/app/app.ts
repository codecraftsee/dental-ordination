import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
})
export class App {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  readonly isMobile = signal(window.innerWidth < 768);
  readonly sidenavOpen = signal(this.loadSidenavState());

  host = {
    '(window:resize)': 'onResize($event)',
  };

  constructor() {
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
    const next = !this.sidenavOpen();
    this.sidenavOpen.set(next);
    if (!this.isMobile()) {
      localStorage.setItem('sidebar-collapsed', String(!next));
    }
  }

  logout(): void {
    this.authService.logout();
  }

  private loadSidenavState(): boolean {
    if (window.innerWidth < 768) return false;
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== 'true';
  }
}
