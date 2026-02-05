import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/translate.pipe';
import { LocalizedDatePipe } from '../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { PatientService } from '../services/patient.service';
import { VisitService } from '../services/visit.service';
import { DoctorService } from '../services/doctor.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { Patient } from '../models/patient.model';
import { Visit } from '../models/visit.model';

@Component({
  selector: 'app-dental-card',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe],
  templateUrl: './dental-card.html',
  styleUrl: './dental-card.scss',
})
export default class DentalCard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private doctorService = inject(DoctorService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  patient = signal<Patient | undefined>(undefined);
  visits = signal<Visit[]>([]);

  totalCost = computed(() => {
    return this.visits().reduce((sum, v) => sum + v.price, 0);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patient.set(this.patientService.getById(id));
      this.visits.set(
        this.visitService.getByPatientId(id).sort((a, b) => a.date.localeCompare(b.date))
      );
    }
    if (!this.patient()) {
      this.router.navigate(['/patients']);
    }
  }

  getDoctorName(id: string): string {
    const d = this.doctorService.getById(id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : '';
  }

  getDiagnosisCode(id: string): string {
    return this.diagnosisService.getById(id)?.code || '';
  }

  getDiagnosisName(id: string): string {
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentCode(id: string): string {
    return this.treatmentService.getById(id)?.code || '';
  }

  getTreatmentName(id: string): string {
    return this.treatmentService.getById(id)?.name || '';
  }
}
