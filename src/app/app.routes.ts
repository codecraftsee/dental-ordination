import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login'), canActivate: [loginGuard] },
  { path: '', loadComponent: () => import('./home/home'), canActivate: [authGuard] },
  { path: 'patients', loadComponent: () => import('./patients/patient-list/patient-list'), canActivate: [authGuard] },
  { path: 'patients/new', loadComponent: () => import('./patients/patient-form/patient-form'), canActivate: [authGuard] },
  { path: 'patients/:id', loadComponent: () => import('./patients/patient-detail/patient-detail'), canActivate: [authGuard] },
  { path: 'patients/:id/edit', loadComponent: () => import('./patients/patient-form/patient-form'), canActivate: [authGuard] },
  { path: 'patients/:id/dental-card', loadComponent: () => import('./dental-card/dental-card'), canActivate: [authGuard] },
  { path: 'doctors', loadComponent: () => import('./doctors/doctor-list/doctor-list'), canActivate: [authGuard] },
  { path: 'doctors/new', loadComponent: () => import('./doctors/doctor-form/doctor-form'), canActivate: [authGuard] },
  { path: 'doctors/:id', loadComponent: () => import('./doctors/doctor-detail/doctor-detail'), canActivate: [authGuard] },
  { path: 'doctors/:id/edit', loadComponent: () => import('./doctors/doctor-form/doctor-form'), canActivate: [authGuard] },
  { path: 'diagnoses', loadComponent: () => import('./diagnoses/diagnoses'), canActivate: [authGuard] },
  { path: 'treatments', loadComponent: () => import('./treatments/treatments'), canActivate: [authGuard] },
  { path: 'visits', loadComponent: () => import('./visits/visit-list/visit-list'), canActivate: [authGuard] },
  { path: 'visits/new', loadComponent: () => import('./visits/visit-form/visit-form'), canActivate: [authGuard] },
  { path: 'visits/:id', loadComponent: () => import('./visits/visit-detail/visit-detail'), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
