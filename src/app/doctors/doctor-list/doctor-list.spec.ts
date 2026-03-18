import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import DoctorList from './doctor-list';
import { TranslateService } from '../../services/translate.service';

describe('DoctorList', () => {
  let component: DoctorList;
  let fixture: ComponentFixture<DoctorList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorList],
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

    fixture = TestBed.createComponent(DoctorList);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with empty search query', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('initializes with empty specialization filter', () => {
    expect(component.specializationFilter()).toBe('');
  });

  it('has specializations available', () => {
    expect(component.specializations.length).toBeGreaterThan(0);
  });
});
