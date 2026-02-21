import { Component, inject, output, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../translate.pipe';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit {
  private readonly themeService = inject(ThemeService);

  readonly collapsed = signal<boolean>(false);
  readonly collapsedChange = output<boolean>();

  readonly isDark = this.themeService.isDark;

  readonly navLinks = [
    { route: '/', label: 'nav.home', icon: '⌂', exact: true },
    { route: '/patients', label: 'nav.patients', icon: '👤', exact: false },
    { route: '/doctors', label: 'nav.doctors', icon: '👨‍⚕️', exact: false },
    { route: '/visits', label: 'nav.visits', icon: '📋', exact: false },
    { route: '/diagnoses', label: 'nav.diagnoses', icon: '🔬', exact: false },
    { route: '/treatments', label: 'nav.treatments', icon: '💊', exact: false },
  ];

  ngOnInit(): void {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Always start closed on mobile
      this.collapsed.set(true);
      this.collapsedChange.emit(true);
    } else {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') {
        this.collapsed.set(true);
        this.collapsedChange.emit(true);
      }
    }
  }

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem('sidebar-collapsed', String(next));
    this.collapsedChange.emit(next);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
