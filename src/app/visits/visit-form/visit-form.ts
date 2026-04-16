import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin, of, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslatePipe } from '../../shared/translate.pipe';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { UserService } from '../../services/user.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { ToastService } from '../../services/toast.service';
import { UserRole } from '../../models/user.model';

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
    MatSlideToggleModule,
  ],
  templateUrl: './visit-form.html',
  styleUrl: './visit-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VisitForm implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private visitService = inject(VisitService);
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private toastService = inject(ToastService);

  get patients() { return this.patientService.getAll(); }
  get doctors() { return this.userService.getByRole(UserRole.Doctor, UserRole.Nurse); }
  get diagnoses() { return this.diagnosisService.getAll(); }
  get treatments() { return this.treatmentService.getAll(); }

  form!: FormGroup;
  isEditMode = false;
  visitId: string | null = null;
  prefilledPatientId: string | null = null;
  returnTo: string | null = null;
  private patchingForm = false;
  private treatmentSub?: Subscription;

  ngOnInit(): void {
    this.visitId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.visitId;

    if (!this.isEditMode) {
      const params = this.route.snapshot.queryParams;
      this.prefilledPatientId = params['patientId'] ?? null;
      this.returnTo = params['returnTo'] ?? null;
    }

    this.form = this.fb.group({
      patientId: [this.prefilledPatientId ?? '', Validators.required],
      doctorId: ['', Validators.required],
      date: [new Date(), Validators.required],
      toothNumber: [null],
      diagnosisId: ['', Validators.required],
      diagnosisNotes: [''],
      treatmentId: ['', Validators.required],
      treatmentNotes: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      paid: [false],
    });

    if (this.prefilledPatientId) {
      this.form.get('patientId')!.disable();
    }

    forkJoin([
      this.patientService.loadAll(),
      this.userService.loadAll(),
      this.diagnosisService.loadAll(),
      this.treatmentService.loadAll(),
    ]).pipe(
      switchMap(() =>
        this.isEditMode && this.visitId ? this.visitService.loadById(this.visitId) : of(null),
      ),
    ).subscribe({
      next: visit => {
        if (visit) {
          this.patchingForm = true;
          this.form.patchValue({
            patientId: visit.patientId,
            doctorId: visit.doctorId,
            date: this.parseDate(visit.date),
            toothNumber: visit.toothNumber,
            diagnosisId: visit.diagnosisId ?? '',
            diagnosisNotes: visit.diagnosisNotes ?? '',
            treatmentId: visit.treatmentId ?? '',
            treatmentNotes: visit.treatmentNotes ?? '',
            price: visit.price ?? 0,
            paid: visit.paid ?? false,
          });
          this.patchingForm = false;
        }
      },
      error: () => this.router.navigate(['/visits']),
    });

    this.treatmentSub = this.form.get('treatmentId')!.valueChanges.subscribe(treatmentId => {
      if (treatmentId && !this.patchingForm) {
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

    const formValue = this.form.getRawValue();
    const payload = {
      ...formValue,
      date: this.formatDate(formValue.date),
      toothNumber: formValue.toothNumber ? Number(formValue.toothNumber) : null,
      price: Number(formValue.price),
      paid: formValue.paid ?? false,
    };

    if (this.isEditMode && this.visitId) {
      const { date: _date, ...updatePayload } = payload;
      this.visitService.update(this.visitId, updatePayload).subscribe({
        next: visit => {
          this.toastService.success('toast.visitUpdated');
          this.router.navigate(['/visits', visit.id]);
        },
        error: err => this.toastService.error(err),
      });
    } else {
      this.visitService.create(payload).subscribe({
        next: visit => {
          this.toastService.success('toast.visitCreated');
          if (this.returnTo) {
            this.router.navigateByUrl(this.returnTo);
          } else {
            this.router.navigate(['/visits', visit.id]);
          }
        },
        error: err => this.toastService.error(err),
      });
    }
  }

  private parseDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
