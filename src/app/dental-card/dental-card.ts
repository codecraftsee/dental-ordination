import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../shared/translate.pipe';
import { LocalizedDatePipe } from '../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { TranslateService } from '../services/translate.service';
import { PatientService } from '../services/patient.service';
import { VisitService } from '../services/visit.service';
import { DoctorService } from '../services/doctor.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { Patient } from '../models/patient.model';
import { Visit } from '../models/visit.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-dental-card',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, MatButtonModule, MatIconModule],
  templateUrl: './dental-card.html',
  styleUrl: './dental-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DentalCard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private doctorService = inject(DoctorService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  patient = signal<Patient | undefined>(undefined);
  visits = signal<Visit[]>([]);
  today = new Date().toISOString().split('T')[0];

  totalCost = computed(() => {
    return this.visits().reduce((sum, v) => sum + (Number(v.price) || 0), 0);
  });

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
        this.visits.set(
          this.visitService.getByPatientId(id).sort((a, b) => a.date.localeCompare(b.date)),
        );
      },
      error: () => this.router.navigate(['/patients']),
    });
  }

  getDoctorName(id: string): string {
    const d = this.doctorService.getById(id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : '';
  }

  formatDiagnosis(visit: Visit): string {
    const diag = visit.diagnosisId ? this.diagnosisService.getById(visit.diagnosisId) : undefined;
    const parts: string[] = [];
    if (diag) parts.push(diag.code);
    if (visit.toothNumber) parts.push(`d ${visit.toothNumber}`);
    if (visit.diagnosisNotes) parts.push(visit.diagnosisNotes);
    return parts.join(' - ');
  }

  formatTreatment(visit: Visit): string {
    const treat = visit.treatmentId ? this.treatmentService.getById(visit.treatmentId) : undefined;
    const parts: string[] = [];
    if (treat) parts.push(treat.name);
    if (visit.treatmentNotes) parts.push(visit.treatmentNotes);
    return parts.join(' - ');
  }

  printCard(): void {
    window.print();
  }

  exportExcel(): void {
    const p = this.patient();
    if (!p) return;

    const t = (key: string) => this.translateService.instant(key);

    const rows: (string | number | undefined)[][] = [];

    rows.push([t('dentalCard.title')]);
    rows.push([]);
    rows.push([`${t('patient.gender')}:`, '', p.gender === 'male' ? t('patient.gender.male') : t('patient.gender.female')]);
    rows.push([`${t('patient.lastName')}:`, '', p.lastName]);
    rows.push([`${t('patient.firstName')}:`, '', p.firstName]);
    rows.push([`${t('patient.parentName')}:`, '', p.parentName || '']);
    rows.push([`${t('patient.dateOfBirth')}:`, '', p.dateOfBirth]);
    rows.push([`${t('patient.address')}:`, '', p.address || '']);
    rows.push([`${t('patient.city')}:`, '', p.city || '']);
    rows.push([`${t('patient.phone')}:`, '', p.phone || '']);
    rows.push([`${t('patient.email')}:`, '', p.email || '']);
    rows.push([`${t('dentalCard.recordDate')}:`, '', this.today]);
    rows.push([]);

    rows.push([
      t('dentalCard.date'),
      '',
      t('dentalCard.diagnosis'),
      '',
      t('dentalCard.treatment'),
      '',
      t('dentalCard.price'),
      '',
      t('dentalCard.doctor'),
    ]);

    for (const visit of this.visits()) {
      rows.push([
        visit.date,
        '',
        this.formatDiagnosis(visit),
        '',
        this.formatTreatment(visit),
        '',
        visit.price || undefined,
        '',
        this.getDoctorName(visit.doctorId),
      ]);
    }

    rows.push([]);
    rows.push(['', '', '', '', t('dentalCard.total'), '', this.totalCost()]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 14 },
      { wch: 2 },
      { wch: 30 },
      { wch: 2 },
      { wch: 40 },
      { wch: 2 },
      { wch: 14 },
      { wch: 2 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const fileName = `${p.lastName} ${p.firstName}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
