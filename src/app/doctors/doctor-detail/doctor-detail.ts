import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    if (id) {
      this.doctor.set(this.doctorService.getById(id));
      this.visits.set(this.visitService.getByDoctorId(id));
    }
    if (!this.doctor()) {
      this.router.navigate(['/doctors']);
    }
  }

  getPatientName(id: string): string {
    const p = this.patientService.getById(id);
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  getDiagnosisName(id: string): string {
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentName(id: string): string {
    return this.treatmentService.getById(id)?.name || '';
  }

  deleteDoctor(): void {
    const d = this.doctor();
    if (d && confirm(this.translateService.translate('common.confirmDelete'))) {
      this.doctorService.delete(d.id);
      this.router.navigate(['/doctors']);
    }
  }
}
