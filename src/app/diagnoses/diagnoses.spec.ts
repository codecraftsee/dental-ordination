import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import Diagnoses from './diagnoses';
import { TranslateService } from '../services/translate.service';

describe('Diagnoses', () => {
  let component: Diagnoses;
  let fixture: ComponentFixture<Diagnoses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Diagnoses],
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

    fixture = TestBed.createComponent(Diagnoses);
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

  it('updates search query on search event', () => {
    const event = { target: { value: 'caries' } } as unknown as Event;
    component.onSearch(event);
    expect(component.searchQuery()).toBe('caries');
  });

  it('has diagnosis categories available', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });

  it('has displayedColumns defined', () => {
    expect(component.displayedColumns).toEqual(['code', 'name', 'category', 'description', 'actions']);
  });

  it('renders add new link pointing to /diagnoses/new', () => {
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/diagnoses/new"]');
    expect(link).toBeTruthy();
  });
});
