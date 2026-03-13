import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/translate.pipe';
import { DiagnosisService } from '../../services/diagnosis.service';
import { DiagnosisCategory } from '../../models/diagnosis.model';

@Component({
  selector: 'app-diagnosis-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './diagnosis-form.html',
  styleUrl: './diagnosis-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DiagnosisForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagnosisService = inject(DiagnosisService);
  private destroyRef = inject(DestroyRef);

  categories = Object.values(DiagnosisCategory);
  isEditMode = false;
  diagnosisId: string | null = null;

  form!: FormGroup;

  ngOnInit(): void {
    this.diagnosisId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.diagnosisId;

    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
    });

    if (this.isEditMode && this.diagnosisId) {
      this.diagnosisService.loadById(this.diagnosisId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: diagnosis => {
          this.form.patchValue({
            code: diagnosis.code,
            name: diagnosis.name,
            category: diagnosis.category,
            description: diagnosis.description,
          });
        },
        error: () => this.router.navigate(['/diagnoses']),
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

    if (this.isEditMode && this.diagnosisId) {
      this.diagnosisService.update(this.diagnosisId, this.form.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.router.navigate(['/diagnoses']);
      });
    } else {
      this.diagnosisService.create(this.form.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.router.navigate(['/diagnoses']);
      });
    }
  }
}
