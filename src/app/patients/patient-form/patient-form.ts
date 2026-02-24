import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '../../shared/translate.pipe';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
  ],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PatientForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);

  isEditMode = false;
  patientId: string | null = null;

  form!: FormGroup;

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.patientId;

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      parentName: ['', Validators.required],
      gender: ['male', Validators.required],
      dateOfBirth: [null, Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    if (this.isEditMode && this.patientId) {
      this.patientService.loadById(this.patientId).subscribe({
        next: patient => {
          this.form.patchValue({
            firstName: patient.firstName,
            lastName: patient.lastName,
            parentName: patient.parentName,
            gender: patient.gender,
            dateOfBirth: this.parseDate(patient.dateOfBirth),
            address: patient.address,
            city: patient.city,
            phone: patient.phone,
            email: patient.email,
          });
        },
        error: () => this.router.navigate(['/patients']),
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload = { ...raw, dateOfBirth: this.formatDate(raw.dateOfBirth) };

    if (this.isEditMode && this.patientId) {
      this.patientService.update(this.patientId, payload).subscribe(patient => {
        this.router.navigate(['/patients', patient.id]);
      });
    } else {
      this.patientService.create(payload).subscribe(patient => {
        this.router.navigate(['/patients', patient.id]);
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
