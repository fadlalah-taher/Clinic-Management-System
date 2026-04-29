import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JwtInterceptor } from './interceptors/jwt.interceptor';

// Auth
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ProfileComponent } from './components/auth/profile/profile.component';

// Layout
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

// Doctors
import { DoctorListComponent } from './components/doctors/doctor-list/doctor-list.component';
import { DoctorFormComponent } from './components/doctors/doctor-form/doctor-form.component';
import { DoctorDetailComponent } from './components/doctors/doctor-detail/doctor-detail.component';

// Patients
import { PatientListComponent } from './components/patients/patient-list/patient-list.component';
import { PatientFormComponent } from './components/patients/patient-form/patient-form.component';
import { PatientDetailComponent } from './components/patients/patient-detail/patient-detail.component';

// Medications
import { MedicationListComponent } from './components/medications/medication-list/medication-list.component';
import { MedicationFormComponent } from './components/medications/medication-form/medication-form.component';

// Appointments
import { AppointmentListComponent } from './components/appointments/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './components/appointments/appointment-form/appointment-form.component';
import { AppointmentDetailComponent } from './components/appointments/appointment-detail/appointment-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    SidebarComponent,
    NavbarComponent,
    DashboardComponent,
    DoctorListComponent,
    DoctorFormComponent,
    DoctorDetailComponent,
    PatientListComponent,
    PatientFormComponent,
    PatientDetailComponent,
    MedicationListComponent,
    MedicationFormComponent,
    AppointmentListComponent,
    AppointmentFormComponent,
    AppointmentDetailComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
