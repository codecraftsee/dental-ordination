import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import Treatments from './treatments';
import { TranslateService } from '../services/translate.service';

describe('Treatments', () => {
  let component: Treatments;
  let fixture: ComponentFixture<Treatments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Treatments],
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

    fixture = TestBed.createComponent(Treatments);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with empty search query', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('initializes with empty category filter', () => {
    expect(component.categoryFilter()).toBe('');
  });

  it('has categories available', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });
});
