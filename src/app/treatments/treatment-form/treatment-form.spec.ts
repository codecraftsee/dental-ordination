import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import TreatmentForm from './treatment-form';
import { TranslateService } from '../../services/translate.service';

describe('TreatmentForm', () => {
  let component: TreatmentForm;
  let fixture: ComponentFixture<TreatmentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentForm],
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

    fixture = TestBed.createComponent(TreatmentForm);
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
    expect(component.form.contains('code')).toBe(true);
    expect(component.form.contains('name')).toBe(true);
    expect(component.form.contains('category')).toBe(true);
    expect(component.form.contains('defaultPrice')).toBe(true);
  });

  it('has categories available', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });
});
