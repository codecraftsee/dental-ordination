import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from './shared/translate.pipe';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcher],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
