import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import DoctorForm from './doctor-form';
import { TranslateService } from '../../services/translate.service';

describe('DoctorForm', () => {
  let component: DoctorForm;
  let fixture: ComponentFixture<DoctorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
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

    fixture = TestBed.createComponent(DoctorForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes in add mode by default', () => {
    expect(component.isEditMode).toBe(false);
  });

  it('creates form with required fields', () => {
    expect(component.form.contains('firstName')).toBe(true);
    expect(component.form.contains('specialization')).toBe(true);
  });

  it('has specializations available', () => {
    expect(component.specializations.length).toBeGreaterThan(0);
  });
});
