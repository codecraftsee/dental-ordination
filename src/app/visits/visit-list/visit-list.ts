import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../shared/translate.pipe';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { CurrencyFormatPipe } from '../../shared/currency-format.pipe';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';

@Component({
  selector: 'app-visit-list',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe],
  templateUrl: './visit-list.html',
  styleUrl: './visit-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VisitList implements OnInit {
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  searchQuery = signal('');
  patientFilter = signal<string>('');
  doctorFilter = signal<string>('');
  dateFromFilter = signal<string>('');
  dateToFilter = signal<string>('');

  patients = computed(() => this.patientService.getAll());
  doctors = computed(() => this.doctorService.getAll());

  private patientNames = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.patientService.getAll()) {
      map.set(p.id, `${p.firstName} ${p.lastName}`);
    }
    return map;
  });

  private doctorNames = computed(() => {
    const map = new Map<string, string>();
    for (const d of this.doctorService.getAll()) {
      map.set(d.id, `Dr. ${d.firstName} ${d.lastName}`);
    }
    return map;
  });

  filteredVisits = computed(() => {
    return this.visitService.search(
      this.searchQuery(),
      {
        patientId: this.patientFilter() || undefined,
        doctorId: this.doctorFilter() || undefined,
        dateFrom: this.dateFromFilter() || undefined,
        dateTo: this.dateToFilter() || undefined,
      },
      this.patientNames(),
      this.doctorNames(),
    );
  });

  ngOnInit(): void {
    forkJoin([
      this.visitService.loadAll(),
      this.patientService.loadAll(),
      this.doctorService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).subscribe();
  }

  getPatientName(id: string): string {
    return this.patientNames().get(id) || '';
  }

  getDoctorName(id: string): string {
    return this.doctorNames().get(id) || '';
  }

  getDiagnosisName(id: string | undefined): string {
    if (!id) return '';
    return this.diagnosisService.getById(id)?.name || '';
  }

  getTreatmentName(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.name || '';
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onPatientChange(event: Event): void {
    this.patientFilter.set((event.target as HTMLSelectElement).value);
  }

  onDoctorChange(event: Event): void {
    this.doctorFilter.set((event.target as HTMLSelectElement).value);
  }

  onDateFromChange(event: Event): void {
    this.dateFromFilter.set((event.target as HTMLInputElement).value);
  }

  onDateToChange(event: Event): void {
    this.dateToFilter.set((event.target as HTMLInputElement).value);
  }
}
