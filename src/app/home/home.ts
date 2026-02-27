import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
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
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, TranslatePipe, LocalizedDatePipe, CurrencyFormatPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home implements OnInit {
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  @ViewChild('xlsxInput') xlsxInput!: ElementRef<HTMLInputElement>;

  loaded = signal(false);
  importing = signal(false);
  importMessage = signal('');
  importError = signal(false);
  totalPatients = 0;
  totalDoctors = 0;
  visitsThisMonth = 0;
  totalVisits = 0;

  get recentVisits() {
    return this.visitService.getRecent(5);
  }

  ngOnInit(): void {
    forkJoin([
      this.patientService.loadAll(),
      this.doctorService.loadAll(),
      this.visitService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).subscribe(() => {
      this.totalPatients = this.patientService.getAll().length;
      this.totalDoctors = this.doctorService.getAll().length;
      this.totalVisits = this.visitService.getAll().length;
      this.visitsThisMonth = this.visitService.getThisMonthCount();
      this.loaded.set(true);
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

  getTreatmentName(id: string | undefined): string {
    if (!id) return '';
    return this.treatmentService.getById(id)?.name || '';
  }

  triggerXlsxInput(): void {
    this.xlsxInput.nativeElement.click();
  }

  onXlsxSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    this.importing.set(true);
    this.importMessage.set('');
    this.importError.set(false);

    this.patientService.importXlsx(Array.from(files)).subscribe({
      next: (result) => {
        this.importing.set(false);
        this.importError.set(result.errors.length > 0);
        const msg = `Imported ${result.filesProcessed} file(s): ${result.patientsCreated} new patient(s), ${result.visitsCreated} visit(s).`;
        this.importMessage.set(result.errors.length > 0 ? msg + ` ${result.errors.length} warning(s).` : msg);
        this.ngOnInit();
      },
      error: (err) => {
        this.importing.set(false);
        this.importError.set(true);
        this.importMessage.set('Import failed: ' + (err.error?.detail || err.message));
      },
    });

    input.value = '';
  }
}
