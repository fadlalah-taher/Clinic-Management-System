import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, DoctorGuard, PatientGuard } from './guards/auth.guard';

import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DoctorListComponent } from './components/doctors/doctor-list/doctor-list.component';
import { DoctorFormComponent } from './components/doctors/doctor-form/doctor-form.component';
import { DoctorDetailComponent } from './components/doctors/doctor-detail/doctor-detail.component';
import { PatientListComponent } from './components/patients/patient-list/patient-list.component';
import { PatientFormComponent } from './components/patients/patient-form/patient-form.component';
import { PatientDetailComponent } from './components/patients/patient-detail/patient-detail.component';
import { MedicationListComponent } from './components/medications/medication-list/medication-list.component';
import { MedicationFormComponent } from './components/medications/medication-form/medication-form.component';
import { AppointmentListComponent } from './components/appointments/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './components/appointments/appointment-form/appointment-form.component';
import { AppointmentDetailComponent } from './components/appointments/appointment-detail/appointment-detail.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },

      // ── Doctors (visible to all; edit restricted to doctor-owner) ──
      { path: 'doctors', component: DoctorListComponent },
      { path: 'doctors/new', component: DoctorFormComponent, canActivate: [DoctorGuard] },
      { path: 'doctors/:id', component: DoctorDetailComponent },
      { path: 'doctors/:id/edit', component: DoctorFormComponent, canActivate: [DoctorGuard] },

      // ── Patients (doctor only) ──────────────────────────────────────
      { path: 'patients', component: PatientListComponent, canActivate: [DoctorGuard] },
      { path: 'patients/new', component: PatientFormComponent, canActivate: [DoctorGuard] },
      { path: 'patients/:id', component: PatientDetailComponent, canActivate: [DoctorGuard] },
      { path: 'patients/:id/edit', component: PatientFormComponent, canActivate: [DoctorGuard] },

      // ── Medications (doctor can manage; patient read-only) ──────────
      { path: 'medications', component: MedicationListComponent },
      { path: 'medications/new', component: MedicationFormComponent, canActivate: [DoctorGuard] },
      { path: 'medications/:id/edit', component: MedicationFormComponent, canActivate: [DoctorGuard] },

      // ── Appointments ────────────────────────────────────────────────
      { path: 'appointments', component: AppointmentListComponent },
      { path: 'appointments/new', component: AppointmentFormComponent, canActivate: [PatientGuard] },
      { path: 'appointments/:id', component: AppointmentDetailComponent },
      { path: 'appointments/:id/edit', component: AppointmentFormComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
