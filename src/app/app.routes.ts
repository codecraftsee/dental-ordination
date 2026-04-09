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
  { path: 'staff', loadComponent: () => import('./staff/staff-list/staff-list'), canActivate: [authGuard] },
  { path: 'staff/new', loadComponent: () => import('./staff/staff-form/staff-form'), canActivate: [authGuard] },
  { path: 'staff/:id', loadComponent: () => import('./staff/staff-detail/staff-detail'), canActivate: [authGuard] },
  { path: 'staff/:id/edit', loadComponent: () => import('./staff/staff-form/staff-form'), canActivate: [authGuard] },
  { path: 'set-password', loadComponent: () => import('./set-password/set-password') },
  { path: 'diagnoses/new', loadComponent: () => import('./diagnoses/diagnosis-form/diagnosis-form'), canActivate: [authGuard] },
  { path: 'diagnoses/:id/edit', loadComponent: () => import('./diagnoses/diagnosis-form/diagnosis-form'), canActivate: [authGuard] },
  { path: 'diagnoses', loadComponent: () => import('./diagnoses/diagnoses'), canActivate: [authGuard] },
  { path: 'treatments/new', loadComponent: () => import('./treatments/treatment-form/treatment-form'), canActivate: [authGuard] },
  { path: 'treatments/:id/edit', loadComponent: () => import('./treatments/treatment-form/treatment-form'), canActivate: [authGuard] },
  { path: 'treatments', loadComponent: () => import('./treatments/treatments'), canActivate: [authGuard] },
  { path: 'visits', loadComponent: () => import('./visits/visit-list/visit-list'), canActivate: [authGuard] },
  { path: 'visits/new', loadComponent: () => import('./visits/visit-form/visit-form'), canActivate: [authGuard] },
  { path: 'visits/:id', loadComponent: () => import('./visits/visit-detail/visit-detail'), canActivate: [authGuard] },
  { path: 'visits/:id/edit', loadComponent: () => import('./visits/visit-form/visit-form'), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./admin/admin'), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
