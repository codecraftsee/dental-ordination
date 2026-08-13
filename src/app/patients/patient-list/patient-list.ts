import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect, viewChild, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { PatientService } from '../../services/patient.service';
import { VisitService } from '../../services/visit.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { Patient } from '../../models/patient.model';
import { Permission } from '../../models/user.model';
import { MatCardModule } from '@angular/material/card';
import { BookTableComponent } from '../../shared/book-table/book-table';
import { HasPermissionPipe } from '../../shared/has-permission.pipe';

@Component({
  selector: 'app-patient-list',
  imports: [RouterLink, MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, LocalizedDatePipe, BookTableComponent, HasPermissionPipe],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PatientList implements OnInit {
  readonly Permission = Permission;
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  readonly displayedColumns = ['name', 'parentName', 'dateOfBirth', 'city', 'phone', 'actions'];
  dataSource = new MatTableDataSource<Patient>();

  searchQuery = signal('');
  cityFilter = signal<string>('');
  genderFilter = signal<string>('');

  cities = computed(() => this.patientService.getCities());

  filteredPatients = computed(() => {
    return this.patientService.search(this.searchQuery(), {
      city: this.cityFilter() || undefined,
      gender: this.genderFilter() || undefined,
    });
  });

  constructor() {
    effect(() => {
      const pag = this.paginator();
      const sort = this.sort();
      if (pag) this.dataSource.paginator = pag;
      if (sort) this.dataSource.sort = sort;
    });

    effect(() => {
      this.dataSource.data = this.filteredPatients();
    });

    this.dataSource.sortingDataAccessor = (item: Patient, header: string): string | number => {
      if (header === 'name') return `${item.firstName} ${item.lastName}`.toLowerCase();
      if (header === 'dateOfBirth') return new Date(item.dateOfBirth).getTime() || 0;
      return String(item[header as keyof Patient] ?? '');
    };
  }

  ngOnInit(): void {
    this.patientService.loadAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    if (!this.visitService.isLoaded()) {
      this.visitService.loadAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  hasDebt(patientId: string): boolean {
    return this.visitService.getByPatientId(patientId).some(v => !v.paid && v.price);
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onCityChange(event: Event): void {
    this.cityFilter.set((event.target as HTMLSelectElement).value);
  }

  onGenderChange(event: Event): void {
    this.genderFilter.set((event.target as HTMLSelectElement).value);
  }

  dismissImportWarning(id: string, event: Event): void {
    event.stopPropagation();
    this.confirmDialogService
      .confirm('common.dismissImportWarningTitle', 'common.dismissImportWarningMessage', {
        icon: 'error_outline',
        iconColor: 'warning',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.patientService.dismissImportWarning(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  deletePatient(id: string): void {
    this.confirmDialogService
      .confirm('patient.deleteTitle', 'patient.deleteMessage')
      .pipe(
        filter(Boolean),
        switchMap(() => this.patientService.delete(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.toastService.success('toast.patientDeleted'),
        error: err => this.toastService.error(err),
      });
  }
}
