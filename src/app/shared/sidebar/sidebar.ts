import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, MatListModule, MatIconModule, MatRippleModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsed]': 'collapsed()',
  },
})
export class Sidebar {
  readonly collapsed = input<boolean>(false);

  readonly navLinks = [
    { route: '/', label: 'nav.home', icon: 'home', exact: true },
    { route: '/patients', label: 'nav.patients', icon: 'people', exact: false },
    { route: '/doctors', label: 'nav.doctors', icon: 'medical_services', exact: false },
    { route: '/visits', label: 'nav.visits', icon: 'calendar_month', exact: false },
    { route: '/diagnoses', label: 'nav.diagnoses', icon: 'biotech', exact: false },
    { route: '/treatments', label: 'nav.treatments', icon: 'medication', exact: false },
    { route: '/admin', label: 'nav.admin', icon: 'settings', exact: false },
  ];
}
