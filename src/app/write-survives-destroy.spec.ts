/**
 * Regression coverage for the write-survives-destroy policy.
 *
 * Reads are torn down with `takeUntilDestroyed`; writes deliberately are not, so
 * navigating away (or a lazy mat-tab switching) cannot abort a mutation that the
 * server is already applying. Ten call sites rely on that, each marked with a
 * "No takeUntilDestroyed" comment, and nothing enforced it — the full suite stayed
 * green through a real regression of exactly this kind.
 *
 * `HttpTestingController` flags a request `cancelled` when its subscriber
 * unsubscribes, which is what `fixture.destroy()` triggers. So `req.cancelled`
 * observed *after* destroy is a direct read of the policy.
 *
 * No `httpMock.verify()` here on purpose: these tests destroy components with
 * writes still in flight, which is the point, and verify() would report those as
 * outstanding.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import DiagnosisForm from './diagnoses/diagnosis-form/diagnosis-form';
import Admin from './admin/admin';
import { PatientDocuments } from './patients/patient-documents/patient-documents';
import Login from './login/login';
import SetPassword from './set-password/set-password';
import { TranslateService } from './services/translate.service';
import { ToastService } from './services/toast.service';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { DiagnosisCategory } from './models/diagnosis.model';

const translateStub = {
  provide: TranslateService,
  useValue: {
    translate: (key: string) => key,
    instant: (key: string) => key,
    format: (key: string) => key,
    translatePlural: (key: string, count: number) => `${key}:${count}`,
    version: signal('en'),
    currentLang: signal('en'),
  },
};

const toastStub = {
  provide: ToastService,
  useValue: { success: vi.fn(), error: vi.fn() },
};

describe('write-survives-destroy', () => {
  let httpMock: HttpTestingController;

  function configure(extraProviders: unknown[] = []): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        translateStub,
        toastStub,
        ...(extraProviders as []),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  }

  describe('the assertion itself', () => {
    // Control case. Without this, `cancelled === false` could pass vacuously —
    // if HttpTestingController never set the flag, every test below would pass
    // no matter how the components behaved.
    it('marks a request cancelled when its subscriber unsubscribes', () => {
      configure();
      const http = TestBed.inject(HttpClient);
      const sub = http.post('/api/control', {}).subscribe();
      const req = httpMock.expectOne('/api/control');
      expect(req.cancelled).toBe(false);

      sub.unsubscribe();

      expect(req.cancelled).toBe(true);
    });
  });

  describe('entity forms (represents patient / visit / staff / treatment / diagnosis forms)', () => {
    let fixture: ComponentFixture<DiagnosisForm>;

    beforeEach(async () => {
      configure();
      await TestBed.compileComponents();
      fixture = TestBed.createComponent(DiagnosisForm);
      fixture.detectChanges();
    });

    it('does not cancel a create when the component is destroyed mid-write', () => {
      fixture.componentInstance.form.patchValue({
        code: 'K02',
        name: 'Karijes',
        category: DiagnosisCategory.Caries,
        description: '',
      });
      fixture.componentInstance.onSubmit();

      const req = httpMock.expectOne(r => r.method === 'POST');
      fixture.destroy();

      expect(req.cancelled).toBe(false);
    });

    it('does not cancel an update when the component is destroyed mid-write', () => {
      const component = fixture.componentInstance;
      component.isEditMode = true;
      component.diagnosisId = 'dx-1';
      component.form.patchValue({
        code: 'K02',
        name: 'Karijes dentina',
        category: DiagnosisCategory.Caries,
        description: '',
      });
      component.onSubmit();

      const req = httpMock.expectOne(r => r.method === 'PUT');
      fixture.destroy();

      expect(req.cancelled).toBe(false);
    });
  });

  describe('patient documents (lazy mat-tab content, destroyed on every tab switch)', () => {
    let fixture: ComponentFixture<PatientDocuments>;

    beforeEach(async () => {
      configure([{ provide: ConfirmDialogService, useValue: { confirm: () => of(true) } }]);
      await TestBed.compileComponents();
      fixture = TestBed.createComponent(PatientDocuments);
      fixture.componentRef.setInput('patientId', 'p-1');
      fixture.detectChanges();
      // The load triggered by the patientId effect is a read; let it settle so the
      // POST below is unambiguous.
      httpMock.match(r => r.method === 'GET').forEach(r => r.flush([]));
    });

    it('does not cancel an upload when the tab is switched away mid-write', () => {
      const file = new File(['x'], 'xray.pdf', { type: 'application/pdf' });
      fixture.componentInstance.pendingFile.set(file);
      fixture.componentInstance.upload();

      const req = httpMock.expectOne(r => r.method === 'POST');
      fixture.destroy();

      expect(req.cancelled).toBe(false);
    });

    it('cancels the document read when the tab is switched away', () => {
      // The other half of the policy: reads must be torn down.
      fixture.componentRef.setInput('patientId', 'p-2');
      fixture.detectChanges();

      const req = httpMock.expectOne(r => r.method === 'GET');
      fixture.destroy();

      expect(req.cancelled).toBe(true);
    });
  });

  describe('auth writes (persist their tokens in a tap)', () => {
    it('does not cancel a login when the component is destroyed mid-write', async () => {
      configure();
      await TestBed.compileComponents();
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret123' });
      fixture.componentInstance.onSubmit();

      const req = httpMock.expectOne(r => r.method === 'POST');
      fixture.destroy();

      expect(req.cancelled).toBe(false);
    });

    it('does not cancel a password set when the component is destroyed mid-write', async () => {
      configure([
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: new Map([['token', 'invite-token']]) } },
        },
      ]);
      await TestBed.compileComponents();
      const fixture = TestBed.createComponent(SetPassword);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue({ password: 'secret123', passwordConfirm: 'secret123' });
      fixture.componentInstance.onSubmit();

      const req = httpMock.expectOne(r => r.method === 'POST');
      fixture.destroy();

      expect(req.cancelled).toBe(false);
    });
  });

  describe('admin bulk delete (slowest writes in the app)', () => {
    let fixture: ComponentFixture<Admin>;

    beforeEach(async () => {
      configure();
      await TestBed.compileComponents();
      fixture = TestBed.createComponent(Admin);
      fixture.detectChanges();
    });

    it('does not cancel a bulk delete when the component is destroyed mid-write', () => {
      fixture.componentInstance.execute(fixture.componentInstance.actions[0]);

      const req = httpMock.expectOne(r => r.method === 'DELETE');
      fixture.destroy();

      expect(req.cancelled).toBe(false);
    });
  });
});
