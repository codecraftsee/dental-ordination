import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import VisitForm from './visit-form';

describe('VisitForm paid toggle', () => {
  let component: VisitForm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
      ],
    });
    component = TestBed.createComponent(VisitForm).componentInstance;
    component.ngOnInit();
  });

  it('form has paid control defaulting to false', () => {
    expect(component.form.get('paid')).toBeTruthy();
    expect(component.form.get('paid')!.value).toBe(false);
  });

  it('paid control can be toggled to true', () => {
    component.form.get('paid')!.setValue(true);
    expect(component.form.get('paid')!.value).toBe(true);
  });
});
