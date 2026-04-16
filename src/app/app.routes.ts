import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';
import { Permission } from './models/user.model';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login'), canActivate: [loginGuard] },
  { path: '', loadComponent: () => import('./home/home'), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./profile/profile'), canActivate: [authGuard] },
  {
    path: 'patients',
    loadComponent: () => import('./patients/patient-list/patient-list'),
    canActivate: [authGuard, permissionGuard([Permission.PatientsRead])],
  },
  {
    path: 'patients/new',
    loadComponent: () => import('./patients/patient-form/patient-form'),
    canActivate: [authGuard, permissionGuard([Permission.PatientsCreate])],
  },
  {
    path: 'patients/:id',
    loadComponent: () => import('./patients/patient-detail/patient-detail'),
    canActivate: [authGuard, permissionGuard([Permission.PatientsRead])],
  },
  {
    path: 'patients/:id/edit',
    loadComponent: () => import('./patients/patient-form/patient-form'),
    canActivate: [authGuard, permissionGuard([Permission.PatientsUpdate])],
  },
  {
    path: 'patients/:id/dental-card',
    loadComponent: () => import('./dental-card/dental-card'),
    canActivate: [authGuard, permissionGuard([Permission.PatientsRead])],
  },
  {
    path: 'staff',
    loadComponent: () => import('./staff/staff-list/staff-list'),
    canActivate: [authGuard, permissionGuard([Permission.UsersRead])],
  },
  {
    path: 'staff/new',
    loadComponent: () => import('./staff/staff-form/staff-form'),
    canActivate: [authGuard, permissionGuard([Permission.UsersCreate])],
  },
  {
    path: 'staff/:id',
    loadComponent: () => import('./staff/staff-detail/staff-detail'),
    canActivate: [authGuard, permissionGuard([Permission.UsersRead])],
  },
  {
    path: 'staff/:id/edit',
    loadComponent: () => import('./staff/staff-form/staff-form'),
    canActivate: [authGuard, permissionGuard([Permission.UsersUpdate])],
  },
  { path: 'set-password', loadComponent: () => import('./set-password/set-password') },
  {
    path: 'diagnoses/new',
    loadComponent: () => import('./diagnoses/diagnosis-form/diagnosis-form'),
    canActivate: [authGuard, permissionGuard([Permission.DiagnosesCreate])],
  },
  {
    path: 'diagnoses/:id/edit',
    loadComponent: () => import('./diagnoses/diagnosis-form/diagnosis-form'),
    canActivate: [authGuard, permissionGuard([Permission.DiagnosesUpdate])],
  },
  {
    path: 'diagnoses',
    loadComponent: () => import('./diagnoses/diagnoses'),
    canActivate: [authGuard, permissionGuard([Permission.DiagnosesRead])],
  },
  {
    path: 'treatments/new',
    loadComponent: () => import('./treatments/treatment-form/treatment-form'),
    canActivate: [authGuard, permissionGuard([Permission.TreatmentsCreate])],
  },
  {
    path: 'treatments/:id/edit',
    loadComponent: () => import('./treatments/treatment-form/treatment-form'),
    canActivate: [authGuard, permissionGuard([Permission.TreatmentsUpdate])],
  },
  {
    path: 'treatments',
    loadComponent: () => import('./treatments/treatments'),
    canActivate: [authGuard, permissionGuard([Permission.TreatmentsRead])],
  },
  {
    path: 'visits',
    loadComponent: () => import('./visits/visit-list/visit-list'),
    canActivate: [authGuard, permissionGuard([Permission.VisitsRead])],
  },
  {
    path: 'visits/new',
    loadComponent: () => import('./visits/visit-form/visit-form'),
    canActivate: [authGuard, permissionGuard([Permission.VisitsCreate])],
  },
  {
    path: 'visits/:id',
    loadComponent: () => import('./visits/visit-detail/visit-detail'),
    canActivate: [authGuard, permissionGuard([Permission.VisitsRead])],
  },
  {
    path: 'visits/:id/edit',
    loadComponent: () => import('./visits/visit-form/visit-form'),
    canActivate: [authGuard, permissionGuard([Permission.VisitsUpdate])],
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin'),
    canActivate: [authGuard, permissionGuard([Permission.AdminBulkDelete])],
  },
  { path: '**', redirectTo: '' },
];
