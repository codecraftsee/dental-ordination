import { Component, inject, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from './shared/translate.pipe';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';
import { Sidebar } from './shared/sidebar/sidebar';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe, LanguageSwitcher, Sidebar],https://github.com/codecraftsee/dental-ordination/pull/6/conflict?name=src%252Fapp%252Fhome%252Fhome.ts&ancestor_oid=2b2c7cef4ea7951c6bcfc8f538edabf62a94dc0d&base_oid=d40bfa4daf7ea5fd8c3d5f3d96e20473787cca95&head_oid=cec20ca307daa1dff7fcd4105e3007afbd765b39
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly sidebarCollapsed = signal<boolean>(false);

  readonly sidebar = viewChild.required(Sidebar);

  logout(): void {
    this.authService.logout();
  }
}
