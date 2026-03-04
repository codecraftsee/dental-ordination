import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import DiagnosisForm from './diagnosis-form';
import { TranslateService } from '../../services/translate.service';

describe('DiagnosisForm', () => {
  let component: DiagnosisForm;
  let fixture: ComponentFixture<DiagnosisForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosisForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TranslateService,
          useValue: {
            translate: (key: string) => key,
            instant: (key: string) => key,
            version: signal('en'),
            currentLang: signal('en'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosisForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes in add mode by default', () => {
    expect(component.isEditMode).toBe(false);
    expect(component.diagnosisId).toBeNull();
  });

  it('creates form with required fields', () => {
    expect(component.form.contains('code')).toBe(true);
    expect(component.form.contains('name')).toBe(true);
    expect(component.form.contains('category')).toBe(true);
    expect(component.form.contains('description')).toBe(true);
  });

  it('marks form as invalid when required fields are empty', () => {
    expect(component.form.valid).toBe(false);
  });

  it('marks form as valid when required fields are filled', () => {
    component.form.patchValue({
      code: 'K02',
      name: 'Caries',
      category: 'Caries',
    });
    expect(component.form.valid).toBe(true);
  });

  it('marks all fields as touched when submitting invalid form', () => {
    expect(component.form.controls['code'].touched).toBe(false);
    component.onSubmit();
    expect(component.form.controls['code'].touched).toBe(true);
    expect(component.form.controls['name'].touched).toBe(true);
    expect(component.form.controls['category'].touched).toBe(true);
  });

  it('has diagnosis categories available', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });
});
