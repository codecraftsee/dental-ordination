import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home') },
  { path: 'patients', loadComponent: () => import('./patients/patient-list/patient-list') },
  { path: 'patients/new', loadComponent: () => import('./patients/patient-form/patient-form') },
  { path: 'patients/:id', loadComponent: () => import('./patients/patient-detail/patient-detail') },
  { path: 'patients/:id/edit', loadComponent: () => import('./patients/patient-form/patient-form') },
  { path: 'patients/:id/dental-card', loadComponent: () => import('./dental-card/dental-card') },
  { path: 'doctors', loadComponent: () => import('./doctors/doctor-list/doctor-list') },
  { path: 'doctors/new', loadComponent: () => import('./doctors/doctor-form/doctor-form') },
  { path: 'doctors/:id', loadComponent: () => import('./doctors/doctor-detail/doctor-detail') },
  { path: 'doctors/:id/edit', loadComponent: () => import('./doctors/doctor-form/doctor-form') },
  { path: 'diagnoses', loadComponent: () => import('./diagnoses/diagnoses') },
  { path: 'treatments', loadComponent: () => import('./treatments/treatments') },
  { path: 'visits', loadComponent: () => import('./visits/visit-list/visit-list') },
  { path: 'visits/new', loadComponent: () => import('./visits/visit-form/visit-form') },
  { path: 'visits/:id', loadComponent: () => import('./visits/visit-detail/visit-detail') },
  { path: '**', redirectTo: '' },
];
