import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/translate.pipe';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss',
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
      dateOfBirth: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    if (this.isEditMode && this.patientId) {
      const patient = this.patientService.getById(this.patientId);
      if (patient) {
        this.form.patchValue({
          firstName: patient.firstName,
          lastName: patient.lastName,
          parentName: patient.parentName,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          address: patient.address,
          city: patient.city,
          phone: patient.phone,
          email: patient.email,
        });
      } else {
        this.router.navigate(['/patients']);
      }
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

    if (this.isEditMode && this.patientId) {
      this.patientService.update(this.patientId, this.form.value);
      this.router.navigate(['/patients', this.patientId]);
    } else {
      const patient = this.patientService.create(this.form.value);
      this.router.navigate(['/patients', patient.id]);
    }
  }
}
