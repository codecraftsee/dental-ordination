import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from './shared/translate.pipe';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcher],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
