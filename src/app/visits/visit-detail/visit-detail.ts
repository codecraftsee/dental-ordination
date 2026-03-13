import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { TranslateService } from '../../services/translate.service';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { Visit } from '../../models/visit.model';

@Component({
  selector: 'app-visit-detail',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './visit-detail.html',
  styleUrl: './visit-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VisitDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

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
      this.doctorService.loadAll(),
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

  getDoctorName(id: string): string {
    const d = this.doctorService.getById(id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : '';
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
    this.visitService.update(v.id, { paid: !v.paid }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(updated => {
      this.visit.set(updated);
    });
  }

  deleteVisit(): void {
    const v = this.visit();
    if (v && confirm(this.translateService.translate('common.confirmDelete'))) {
      this.visitService.delete(v.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.router.navigate(['/visits']);
      });
    }
  }
}
