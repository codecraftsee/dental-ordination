import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '../../shared/translate.pipe';
import { DoctorService } from '../../services/doctor.service';
import { Specialization } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './doctor-form.html',
  styleUrl: './doctor-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DoctorForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private doctorService = inject(DoctorService);

  specializations = Object.values(Specialization);
  isEditMode = false;
  doctorId: string | null = null;

  form!: FormGroup;

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.doctorId;

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      specialization: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      licenseNumber: ['', Validators.required],
    });

    if (this.isEditMode && this.doctorId) {
      this.doctorService.loadById(this.doctorId).subscribe({
        next: doctor => {
          this.form.patchValue({
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            specialization: doctor.specialization,
            phone: doctor.phone,
            email: doctor.email,
            licenseNumber: doctor.licenseNumber,
          });
        },
        error: () => this.router.navigate(['/doctors']),
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

    if (this.isEditMode && this.doctorId) {
      this.doctorService.update(this.doctorId, this.form.value).subscribe(doctor => {
        this.router.navigate(['/doctors', doctor.id]);
      });
    } else {
      this.doctorService.create(this.form.value).subscribe(doctor => {
        this.router.navigate(['/doctors', doctor.id]);
      });
    }
  }
}
