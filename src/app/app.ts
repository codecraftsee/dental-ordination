import { Component, inject, signal, viewChild, ChangeDetectionStrategy, effect } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from './shared/translate.pipe';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';
import { Sidebar } from './shared/sidebar/sidebar';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe, LanguageSwitcher, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly sidebarCollapsed = signal<boolean>(false);

  readonly sidebar = viewChild.required(Sidebar);

  constructor() {
    // Close sidebar on navigation on mobile
    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => {
      if (window.innerWidth < 768 && !this.sidebarCollapsed()) {
        this.sidebar().toggle();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
