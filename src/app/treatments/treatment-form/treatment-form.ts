import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/translate.pipe';
import { TreatmentService } from '../../services/treatment.service';
import { TreatmentCategory } from '../../models/treatment.model';

@Component({
  selector: 'app-treatment-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './treatment-form.html',
  styleUrl: './treatment-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TreatmentForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private treatmentService = inject(TreatmentService);

  categories = Object.values(TreatmentCategory);
  isEditMode = false;
  treatmentId: string | null = null;

  form!: FormGroup;

  ngOnInit(): void {
    this.treatmentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.treatmentId;

    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      defaultPrice: [0, [Validators.required, Validators.min(0)]],
    });

    if (this.isEditMode && this.treatmentId) {
      this.treatmentService.loadById(this.treatmentId).subscribe({
        next: treatment => {
          this.form.patchValue({
            code: treatment.code,
            name: treatment.name,
            category: treatment.category,
            description: treatment.description,
            defaultPrice: treatment.defaultPrice,
          });
        },
        error: () => this.router.navigate(['/treatments']),
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

    if (this.isEditMode && this.treatmentId) {
      this.treatmentService.update(this.treatmentId, this.form.value).subscribe(() => {
        this.router.navigate(['/treatments']);
      });
    } else {
      this.treatmentService.create(this.form.value).subscribe(() => {
        this.router.navigate(['/treatments']);
      });
    }
  }
}
