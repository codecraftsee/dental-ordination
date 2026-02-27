import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Sidebar } from './sidebar';
import { TranslateService } from '../../services/translate.service';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
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

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('has exactly 7 nav links', () => {
    expect(component.navLinks.length).toBe(7);
  });

  it('home link uses exact matching', () => {
    const home = component.navLinks.find(l => l.route === '/');
    expect(home?.exact).toBe(true);
  });

  it('all non-home links use non-exact matching', () => {
    const nonHome = component.navLinks.filter(l => l.route !== '/');
    expect(nonHome.every(l => l.exact === false)).toBe(true);
  });

  it('every nav link has a route, label, and icon', () => {
    for (const link of component.navLinks) {
      expect(link.route).toBeTruthy();
      expect(link.label).toBeTruthy();
      expect(link.icon).toBeTruthy();
    }
  });

  it('renders a list item for each nav link', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('[mat-list-item]');
    expect(items.length).toBe(component.navLinks.length);
  });
});
