import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, forkJoin, switchMap } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { UserService } from '../../services/user.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { HasPermissionPipe } from '../../shared/has-permission.pipe';
import { Permission } from '../../models/user.model';
import { Visit } from '../../models/visit.model';

@Component({
  selector: 'app-visit-detail',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, HasPermissionPipe, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './visit-detail.html',
  styleUrl: './visit-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VisitDetail implements OnInit {
  readonly Permission = Permission;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private destroyRef = inject(DestroyRef);

  visit = signal<Visit | undefined>(undefined);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/visits']);
      return;
    }

    forkJoin([
      this.visitService.loadById(id),
      this.patientService.loadAll(),
      this.userService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([visit]) => this.visit.set(visit),
      error: () => this.router.navigate(['/visits']),
    });
  }

  getPatientName(id: string): string {
    const p = this.patientService.getById(id);
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  getDoctorName(v: Visit): string {
    return this.userService.getDisplayName(v.doctorId) || this.fallbackDoctorName(v);
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

  getDiagnosisCode(id: string | undefined): string {
    if (!id) return '';
    return this.diagnosisService.getById(id)?.code || '';
  }

  getTreatmentName(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.name || '';
  }

  getTreatmentCode(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.code || '';
  }

  togglePaid(): void {
    const v = this.visit();
    if (!v) return;
    this.visitService.update(v.id, { paid: !v.paid })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => {
        this.visit.set(updated);
      });
  }

  dismissImportWarning(event: Event): void {
    const v = this.visit();
    if (!v) return;
    event.stopPropagation();
    this.confirmDialogService
      .confirm('common.dismissImportWarningTitle', 'common.dismissImportWarningMessage', {
        icon: 'error_outline',
        iconColor: 'warning',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.visitService.dismissImportWarning(v.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(updated => {
        this.visit.set(updated);
      });
  }

  deleteVisit(): void {
    const v = this.visit();
    if (!v) return;
    this.confirmDialogService
      .confirm('visit.deleteTitle', 'visit.deleteMessage')
      .pipe(
        filter(Boolean),
        switchMap(() => this.visitService.delete(v.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('toast.visitDeleted');
          this.router.navigate(['/visits']);
        },
        error: err => this.toastService.error(err),
      });
  }

}
