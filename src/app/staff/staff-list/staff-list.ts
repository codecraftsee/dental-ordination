import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect, viewChild, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../shared/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { HasPermissionPipe } from '../../shared/has-permission.pipe';
import { Permission, User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-staff-list',
  imports: [RouterLink, TranslatePipe, HasPermissionPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './staff-list.html',
  styleUrl: './staff-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StaffList implements OnInit {
  readonly Permission = Permission;
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  protected readonly UserRole = UserRole;
  readonly roles: UserRole[] = [UserRole.Doctor, UserRole.Nurse];
  displayedColumns = ['name', 'role', 'specialization', 'phone', 'email', 'actions'];
  dataSource = new MatTableDataSource<User>();
  searchQuery = signal('');
  roleFilter = signal<UserRole | ''>('');

  filteredStaff = computed(() => {
    const role = this.roleFilter() as UserRole | undefined;
    const rolesToShow: UserRole[] = role ? [role] : [UserRole.Doctor, UserRole.Nurse];
    const currentUserId = this.authService.user()?.id;
    return this.userService.search(this.searchQuery(), { role: undefined }).filter(u =>
      rolesToShow.includes(u.role) && u.id !== currentUserId,
    );
  });

  constructor() {
    effect(() => {
      const pag = this.paginator();
      const sort = this.sort();
      if (pag) this.dataSource.paginator = pag;
      if (sort) this.dataSource.sort = sort;
    });

    effect(() => {
      this.dataSource.data = this.filteredStaff();
    });

    this.dataSource.sortingDataAccessor = (item: User, header: string): string => {
      if (header === 'name') return `${item.firstName ?? ''} ${item.lastName ?? ''}`.toLowerCase();
      if (header === 'role') return item.role;
      if (header === 'specialization') return item.specialization ?? '';
      if (header === 'phone') return item.phone ?? '';
      if (header === 'email') return item.email;
      return '';
    };
  }

  ngOnInit(): void {
    this.userService.loadAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  deleteStaff(id: string): void {
    this.confirmDialogService
      .confirm('staff.deleteTitle', 'staff.deleteMessage')
      .pipe(
        filter(Boolean),
        switchMap(() => this.userService.delete(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.toastService.success('toast.staffDeleted'),
        error: err => this.toastService.error(err),
      });
  }
}
