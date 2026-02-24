import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, TranslatePipe, MatListModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private router = inject(Router);

  readonly navLinks = [
    { route: '/', label: 'nav.home', icon: 'home', exact: true },
    { route: '/patients', label: 'nav.patients', icon: 'people', exact: false },
    { route: '/doctors', label: 'nav.doctors', icon: 'medical_services', exact: false },
    { route: '/visits', label: 'nav.visits', icon: 'calendar_month', exact: false },
    { route: '/diagnoses', label: 'nav.diagnoses', icon: 'biotech', exact: false },
    { route: '/treatments', label: 'nav.treatments', icon: 'medication', exact: false },
    { route: '/admin', label: 'nav.admin', icon: 'settings', exact: false },
  ];

  isActive(route: string, exact: boolean): boolean {
    return this.router.isActive(route, {
      paths: exact ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
