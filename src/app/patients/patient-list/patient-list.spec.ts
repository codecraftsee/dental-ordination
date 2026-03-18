import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import PatientList from './patient-list';
import { TranslateService } from '../../services/translate.service';

describe('PatientList', () => {
  let component: PatientList;
  let fixture: ComponentFixture<PatientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientList],
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

    fixture = TestBed.createComponent(PatientList);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with empty search query', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('initializes with empty city filter', () => {
    expect(component.cityFilter()).toBe('');
  });

  it('initializes with empty gender filter', () => {
    expect(component.genderFilter()).toBe('');
  });
});
