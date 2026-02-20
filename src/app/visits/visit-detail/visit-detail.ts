import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe],
  templateUrl: './visit-detail.html',
  styleUrl: './visit-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VisitDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
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
    ]).subscribe({
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

  deleteVisit(): void {
    const v = this.visit();
    if (v && confirm(this.translateService.translate('common.confirmDelete'))) {
      this.visitService.delete(v.id).subscribe(() => {
        this.router.navigate(['/visits']);
      });
    }
  }
}
