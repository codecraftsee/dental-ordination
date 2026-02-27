import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { TranslateService } from '../../services/translate.service';
import { PatientService } from '../../services/patient.service';
import { VisitService } from '../../services/visit.service';
import { DoctorService } from '../../services/doctor.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { Patient } from '../../models/patient.model';
import { Visit } from '../../models/visit.model';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PatientDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private doctorService = inject(DoctorService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  patient = signal<Patient | undefined>(undefined);
  allVisits = signal<Visit[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/patients']);
      return;
    }

    forkJoin([
      this.patientService.loadById(id),
      this.visitService.loadAll({ patientId: id }),
      this.doctorService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).subscribe({
      next: ([patient]) => {
        this.patient.set(patient);
        this.allVisits.set(this.visitService.getByPatientId(id));
      },
      error: () => this.router.navigate(['/patients']),
    });
  }

  getInitials(p: Patient): string {
    return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
  }

  getAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  getVisitsThisYear(): number {
    const year = new Date().getFullYear().toString();
    return this.allVisits().filter(v => v.date.startsWith(year)).length;
  }

  getDoctorName(id: string): string {
    const d = this.doctorService.getById(id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : '';
  }

  getDiagnosisName(id: string | undefined): string {
    if (!id) return '';
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentName(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.name || '';
  }

  deletePatient(): void {
    const p = this.patient();
    if (p && confirm(this.translateService.translate('common.confirmDelete'))) {
      this.patientService.delete(p.id).subscribe(() => {
        this.router.navigate(['/patients']);
      });
    }
  }
}
