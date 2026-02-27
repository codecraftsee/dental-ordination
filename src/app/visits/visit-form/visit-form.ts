import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/translate.pipe';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';

@Component({
  selector: 'app-visit-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './visit-form.html',
  styleUrl: './visit-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VisitForm implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);

  get patients() { return this.patientService.getAll(); }
  get doctors() { return this.doctorService.getAll(); }
  get diagnoses() { return this.diagnosisService.getAll(); }
  get treatments() { return this.treatmentService.getAll(); }

  form!: FormGroup;
  private treatmentSub?: Subscription;

  ngOnInit(): void {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      date: [new Date(), Validators.required],
      toothNumber: [null],
      diagnosisId: ['', Validators.required],
      diagnosisNotes: [''],
      treatmentId: ['', Validators.required],
      treatmentNotes: [''],
      price: [0, [Validators.required, Validators.min(0)]],
    });

    forkJoin([
      this.patientService.loadAll(),
      this.doctorService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).subscribe();

    this.treatmentSub = this.form.get('treatmentId')!.valueChanges.subscribe(treatmentId => {
      if (treatmentId) {
        const treatment = this.treatmentService.getById(treatmentId);
        if (treatment) {
          this.form.get('price')!.setValue(treatment.defaultPrice);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.treatmentSub?.unsubscribe();
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    this.visitService.create({
      ...formValue,
      date: this.formatDate(formValue.date),
      toothNumber: formValue.toothNumber ? Number(formValue.toothNumber) : null,
      price: Number(formValue.price),
    }).subscribe(visit => {
      this.router.navigate(['/visits', visit.id]);
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
