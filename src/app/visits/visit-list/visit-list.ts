import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect, viewChild, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, forkJoin, switchMap } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { AuthService } from '../../services/auth.service';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { UserService } from '../../services/user.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { HasPermissionPipe } from '../../shared/has-permission.pipe';
import { Visit } from '../../models/visit.model';
import { Permission, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-visit-list',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, HasPermissionPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './visit-list.html',
  styleUrl: './visit-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VisitList implements OnInit {
  readonly Permission = Permission;
  protected readonly UserRole = UserRole;

  private authService = inject(AuthService);
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  displayedColumns = ['date', 'patient', 'doctor', 'tooth', 'diagnosis', 'treatment', 'price', 'actions'];
  dataSource = new MatTableDataSource<Visit>();
  searchQuery = signal('');
  patientFilter = signal<string>('');
  doctorFilter = signal<string>('');
  dateFromFilter = signal<string>('');
  dateToFilter = signal<string>('');

  patients = computed(() => this.patientService.getAll());
  doctors = computed(() => this.userService.getByRole(UserRole.Doctor, UserRole.Nurse));

  private patientNames = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.patientService.getAll()) {
      map.set(p.id, `${p.firstName} ${p.lastName}`);
    }
    return map;
  });

  private doctorNames = computed(() => {
    const map = new Map<string, string>();
    for (const u of this.userService.getAll()) {
      map.set(u.id, this.userService.getDisplayName(u.id));
    }
    return map;
  });

  filteredVisits = computed(() => {
    return this.visitService.search(
      this.searchQuery(),
      {
        patientId: this.patientFilter() || undefined,
        doctorId: this.doctorFilter() || undefined,
        dateFrom: this.dateFromFilter() || undefined,
        dateTo: this.dateToFilter() || undefined,
      },
      this.patientNames(),
      this.doctorNames(),
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
      this.dataSource.data = this.filteredVisits();
    });

    this.dataSource.sortingDataAccessor = (item: Visit, header: string) => {
      if (header === 'patient') return this.patientNames().get(item.patientId) ?? '';
      if (header === 'doctor') return this.getDoctorName(item);
      return (item as unknown as Record<string, unknown>)[header] as string | number ?? '';
    };
  }

  ngOnInit(): void {
    forkJoin([
      this.visitService.loadAll(),
      this.patientService.loadAll(),
      this.userService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.authService.hasRole(UserRole.Doctor)) {
        const userId = this.authService.user()?.id;
        if (userId) {
          this.doctorFilter.set(userId);
        }
      }
    });
  }

  getPatientName(id: string): string {
    return this.patientNames().get(id) || '';
  }

  getDoctorName(v: Visit): string {
    return this.doctorNames().get(v.doctorId) || this.fallbackDoctorName(v);
  }

  isDoctorActive(id: string): boolean {
    return this.userService.isActive(id);
  }

  private fallbackDoctorName(v: Visit): string {
    if (!v.doctor) return '';
    const name = [v.doctor.firstName, v.doctor.lastName].filter(Boolean).join(' ');
    return `Dr. ${name}`;
  }

  getDiagnosisName(id: string | undefined): string {
    if (!id) return '';
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentName(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.name || '';
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onPatientChange(event: Event): void {
    this.patientFilter.set((event.target as HTMLSelectElement).value);
  }

  onDoctorChange(event: Event): void {
    this.doctorFilter.set((event.target as HTMLSelectElement).value);
  }

  onDateFromChange(event: MatDatepickerInputEvent<Date>): void {
    this.dateFromFilter.set(event.value ? this.formatDate(event.value) : '');
  }

  onDateToChange(event: MatDatepickerInputEvent<Date>): void {
    this.dateToFilter.set(event.value ? this.formatDate(event.value) : '');
  }

  dismissImportWarning(id: string, event: Event): void {
    event.stopPropagation();
    this.confirmDialogService
      .confirm('common.dismissImportWarningTitle', 'common.dismissImportWarningMessage', {
        icon: 'error_outline',
        iconColor: 'warning',
      })
      .pipe(
        // Before switchMap: cancels the dialog, never an in-flight write.
        takeUntilDestroyed(this.destroyRef),
        filter(Boolean),
        switchMap(() => this.visitService.dismissImportWarning(id)),
      )
      .subscribe();
  }

  deleteVisit(id: string): void {
    this.confirmDialogService
      .confirm('visit.deleteTitle', 'visit.deleteMessage')
      .pipe(
        // Before switchMap: cancels the dialog, never an in-flight delete.
        takeUntilDestroyed(this.destroyRef),
        filter(Boolean),
        switchMap(() => this.visitService.delete(id)),
      )
      .subscribe({
        next: () => this.toastService.success('toast.visitDeleted'),
        error: err => this.toastService.error(err),
      });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
