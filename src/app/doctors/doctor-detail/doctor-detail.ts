import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { TranslateService } from '../../services/translate.service';
import { DoctorService } from '../../services/doctor.service';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { Doctor } from '../../models/doctor.model';
import { Visit } from '../../models/visit.model';

@Component({
  selector: 'app-doctor-detail',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe],
  templateUrl: './doctor-detail.html',
  styleUrl: './doctor-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DoctorDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private doctorService = inject(DoctorService);
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  doctor = signal<Doctor | undefined>(undefined);
  visits = signal<Visit[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/doctors']);
      return;
    }

    forkJoin([
      this.doctorService.loadById(id),
      this.visitService.loadAll({ doctorId: id }),
      this.patientService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).subscribe({
      next: ([doctor]) => {
        this.doctor.set(doctor);
        this.visits.set(this.visitService.getByDoctorId(id));
      },
      error: () => this.router.navigate(['/doctors']),
    });
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

  deleteDoctor(): void {
    const d = this.doctor();
    if (d && confirm(this.translateService.translate('common.confirmDelete'))) {
      this.doctorService.delete(d.id).subscribe(() => {
        this.router.navigate(['/doctors']);
      });
    }
  }
}
