import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TranslatePipe } from '../translate.pipe';
import { AuthService } from '../../services/auth.service';
import { Permission } from '../../models/user.model';

interface NavLink {
  route: string;
  label: string;
  icon: string;
  exact: boolean;
  permission?: Permission;
}

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
  private authService = inject(AuthService);

  readonly collapsed = input<boolean>(false);

  private readonly allNavLinks: NavLink[] = [
    { route: '/', label: 'nav.home', icon: 'home', exact: true },
    { route: '/patients', label: 'nav.patients', icon: 'people', exact: false, permission: Permission.PatientsRead },
    { route: '/staff', label: 'nav.staff', icon: 'badge', exact: false, permission: Permission.UsersRead },
    { route: '/visits', label: 'nav.visits', icon: 'calendar_month', exact: false, permission: Permission.VisitsRead },
    { route: '/diagnoses', label: 'nav.diagnoses', icon: 'biotech', exact: false, permission: Permission.DiagnosesRead },
    { route: '/treatments', label: 'nav.treatments', icon: 'medication', exact: false, permission: Permission.TreatmentsRead },
    { route: '/admin', label: 'nav.admin', icon: 'settings', exact: false, permission: Permission.AdminBulkDelete },
  ];

  readonly navLinks = computed(() => {
    this.authService.userPermissions();
    return this.allNavLinks.filter(link =>
      !link.permission || this.authService.hasPermission(link.permission),
    );
  });
}
