import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../shared/translate.pipe';
import { LocalizedDatePipe } from '../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { TranslateService } from '../services/translate.service';
import { PatientService } from '../services/patient.service';
import { VisitService } from '../services/visit.service';
import { UserService } from '../services/user.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { Patient } from '../models/patient.model';
import { Visit } from '../models/visit.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { BookTableComponent } from '../shared/book-table/book-table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-dental-card',
  imports: [TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe, MatButtonModule, MatIconModule, MatTableModule, MatCardModule, BookTableComponent],
  templateUrl: './dental-card.html',
  styleUrl: './dental-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DentalCard {
  private translateService = inject(TranslateService);
  private patientService = inject(PatientService);
  private visitService = inject(VisitService);
  private userService = inject(UserService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private destroyRef = inject(DestroyRef);

  patientId = input.required<string>();

  patient = signal<Patient | undefined>(undefined);
  visits = signal<Visit[]>([]);
  today = new Date().toISOString().split('T')[0];
  dataSource = new MatTableDataSource<Visit>();
  displayedColumns = ['date', 'diagnosis', 'treatment', 'price', 'paid', 'doctor'];

  totalCost = computed(() => {
    return this.visits().reduce((sum, v) => sum + (v.price ?? 0), 0);
  });

  constructor() {
    effect(() => {
      const id = this.patientId();
      untracked(() => this.loadData(id));
    });
  }

  private loadData(id: string): void {
    forkJoin([
      this.patientService.loadById(id),
      this.visitService.loadAll({ patientId: id }),
      this.userService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([patient]) => {
      this.patient.set(patient);
      const sorted = this.visitService.getByPatientId(id).sort((a, b) => a.date.localeCompare(b.date));
      this.visits.set(sorted);
      this.dataSource.data = sorted;
    });
  }

  getDoctorName(id: string): string {
    return this.userService.getDisplayName(id);
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
