import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/translate.pipe';
import { LocalizedDatePipe } from '../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { PatientService } from '../services/patient.service';
import { DoctorService } from '../services/doctor.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  totalPatients = this.patientService.getAll().length;
  totalDoctors = this.doctorService.getAll().length;
  visitsThisMonth = this.visitService.getThisMonthCount();
  totalVisits = this.visitService.getAll().length;
  recentVisits = this.visitService.getRecent(5);

  getPatientName(id: string): string {
    const p = this.patientService.getById(id);
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  getDoctorName(id: string): string {
    const d = this.doctorService.getById(id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : '';
  }

  getDiagnosisName(id: string): string {
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentName(id: string): string {
    return this.treatmentService.getById(id)?.name || '';
  }
}
