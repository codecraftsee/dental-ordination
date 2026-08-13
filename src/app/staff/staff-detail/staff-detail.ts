import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild, effect, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, forkJoin, switchMap } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { HasPermissionPipe } from '../../shared/has-permission.pipe';
import { Permission, User, UserRole } from '../../models/user.model';
import { Visit } from '../../models/visit.model';

@Component({
  selector: 'app-staff-detail',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, HasPermissionPipe, MatCardModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule],
  templateUrl: './staff-detail.html',
  styleUrl: './staff-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StaffDetail implements OnInit {
  readonly Permission = Permission;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private destroyRef = inject(DestroyRef);

  private paginator = viewChild(MatPaginator);

  protected readonly UserRole = UserRole;
  visitColumns = ['date', 'patient', 'tooth', 'diagnosis', 'treatment', 'price'];
  member = signal<User | undefined>(undefined);
  visits = signal<Visit[]>([]);
  visitsDataSource = new MatTableDataSource<Visit>();

  constructor() {
    effect(() => {
      const pag = this.paginator();
      if (pag) this.visitsDataSource.paginator = pag;
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/staff']);
      return;
    }

    forkJoin([
      this.userService.loadById(id),
      this.visitService.loadAll({ doctorId: id }),
      this.patientService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([user]) => {
        this.member.set(user);
        const memberVisits = this.visitService.getByDoctorId(id);
        this.visits.set(memberVisits);
        this.visitsDataSource.data = memberVisits;
      },
      error: () => this.router.navigate(['/staff']),
    });
  }

  getInitials(u: User): string {
    const f = u.firstName?.[0] ?? '';
    const l = u.lastName?.[0] ?? '';
    return `${f}${l}`.toUpperCase() || u.email[0].toUpperCase();
  }

  getDisplayName(u: User): string {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return u.role === UserRole.Doctor ? `Dr. ${name}` : name;
  }

  getVisitsThisYear(): number {
    const year = new Date().getFullYear().toString();
    return this.visits().filter(v => v.date.startsWith(year)).length;
  }

  getUniquePatients(): number {
    return new Set(this.visits().map(v => v.patientId)).size;
  }

  getPatientName(id: string): string {
    const p = this.patientService.getById(id);
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  getDiagnosisName(id: string | undefined): string {
    if (!id) return '';
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentName(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.name || '';
  }

  resendInvite(): void {
    const u = this.member();
    if (!u) return;
    // No takeUntilDestroyed: navigating away must not abort the write.
    this.userService.resendInvite(u.id).subscribe({
      next: () => this.toastService.success('toast.inviteResent'),
      error: err => this.toastService.error(err),
    });
  }

  deleteStaff(): void {
    const u = this.member();
    if (!u) return;
    this.confirmDialogService
      .confirm('staff.deleteTitle', 'staff.deleteMessage')
      .pipe(
        // Before switchMap: cancels the dialog, never an in-flight delete.
        takeUntilDestroyed(this.destroyRef),
        filter(Boolean),
        switchMap(() => this.userService.delete(u.id)),
      )
      .subscribe({
        next: () => {
          this.toastService.success('toast.staffDeleted');
          this.router.navigate(['/staff']);
        },
        error: err => this.toastService.error(err),
      });
  }
}
