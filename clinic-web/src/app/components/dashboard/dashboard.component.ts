import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../services/appointment.service';
import { MedicationService } from '../../services/medication.service';
import { AuthService } from '../../services/auth.service';
import { Appointment, User } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <!-- ==================== DOCTOR DASHBOARD ==================== -->
      <ng-container *ngIf="isDoctor">
        <div class="d-flex align-items-center gap-3 mb-4">
          <div class="avatar-lg bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center">
            <i class="bi bi-person-badge fs-3"></i>
          </div>
          <div>
            <h3 class="mb-0 fw-bold">Welcome, Dr. {{ user?.first_name || user?.username }}</h3>
            <p class="text-muted mb-0">{{ user?.doctor_specialty | titlecase }} &bull; Your dashboard overview</p>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-xl-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                  <i class="bi bi-calendar-check fs-4 text-primary"></i>
                </div>
                <div>
                  <div class="fs-2 fw-bold">{{ doctorAppointments.length }}</div>
                  <div class="text-muted small">Total Appointments</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-xl-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-warning bg-opacity-10 p-3">
                  <i class="bi bi-clock-history fs-4 text-warning"></i>
                </div>
                <div>
                  <div class="fs-2 fw-bold">{{ scheduledCount }}</div>
                  <div class="text-muted small">Upcoming</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-xl-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-success bg-opacity-10 p-3">
                  <i class="bi bi-check-circle fs-4 text-success"></i>
                </div>
                <div>
                  <div class="fs-2 fw-bold">{{ completedCount }}</div>
                  <div class="text-muted small">Completed</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-xl-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-info bg-opacity-10 p-3">
                  <i class="bi bi-capsule fs-4 text-info"></i>
                </div>
                <div>
                  <div class="fs-2 fw-bold">{{ medicationCount }}</div>
                  <div class="text-muted small">Medications</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <span class="fw-semibold">Your Upcoming Appointments</span>
            <a routerLink="/appointments" class="btn btn-sm btn-outline-primary">View All</a>
          </div>
          <div class="card-body p-0">
            <div *ngIf="loadingAppts" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
            <div *ngIf="!loadingAppts && doctorAppointments.length === 0" class="text-center py-4 text-muted">
              No appointments yet.
            </div>
            <div class="table-responsive" *ngIf="!loadingAppts && doctorAppointments.length > 0">
              <table class="table table-hover mb-0">
                <thead class="table-light"><tr>
                  <th>Date</th><th>Reason</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  <tr *ngFor="let a of doctorAppointments.slice(0,5)">
                    <td>{{ a.date | date:'mediumDate' }}</td>
                    <td>{{ a.reason }}</td>
                    <td><span class="badge" [class]="statusBadge(a.status)">{{ a.status }}</span></td>
                    <td><a [routerLink]="['/appointments', a.id]" class="btn btn-sm btn-outline-secondary">View</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white fw-semibold">Quick Actions</div>
          <div class="card-body d-flex gap-2 flex-wrap">
            <a routerLink="/patients" class="btn btn-outline-success">
              <i class="bi bi-people me-1"></i> Manage Patients
            </a>
            <a routerLink="/medications" class="btn btn-outline-secondary">
              <i class="bi bi-capsule me-1"></i> Medications
            </a>
            <a *ngIf="user?.doctor_id" [routerLink]="['/doctors', user?.doctor_id, 'edit']"
              class="btn btn-outline-primary">
              <i class="bi bi-person-gear me-1"></i> Edit My Profile
            </a>
          </div>
        </div>
      </ng-container>

      <!-- ==================== PATIENT DASHBOARD ==================== -->
      <ng-container *ngIf="isPatient">
        <div class="d-flex align-items-center gap-3 mb-4">
          <div class="avatar-lg bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center">
            <i class="bi bi-person-heart fs-3"></i>
          </div>
          <div>
            <h3 class="mb-0 fw-bold">Welcome, {{ user?.first_name || user?.username }}</h3>
            <p class="text-muted mb-0">Manage your health appointments</p>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-sm-6 col-xl-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-success bg-opacity-10 p-3">
                  <i class="bi bi-calendar-check fs-4 text-success"></i>
                </div>
                <div>
                  <div class="fs-2 fw-bold">{{ patientAppointments.length }}</div>
                  <div class="text-muted small">Total Appointments</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-xl-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-warning bg-opacity-10 p-3">
                  <i class="bi bi-clock-history fs-4 text-warning"></i>
                </div>
                <div>
                  <div class="fs-2 fw-bold">{{ scheduledCount }}</div>
                  <div class="text-muted small">Upcoming</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-xl-4 d-flex align-items-center">
            <a routerLink="/appointments/new" class="btn btn-success btn-lg w-100 py-3">
              <i class="bi bi-plus-circle me-2"></i> Book New Appointment
            </a>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <span class="fw-semibold">Your Appointments</span>
            <a routerLink="/appointments" class="btn btn-sm btn-outline-success">View All</a>
          </div>
          <div class="card-body p-0">
            <div *ngIf="loadingAppts" class="text-center py-4">
              <div class="spinner-border text-success"></div>
            </div>
            <div *ngIf="!loadingAppts && patientAppointments.length === 0" class="text-center py-4 text-muted">
              No appointments yet. <a routerLink="/appointments/new">Book your first one!</a>
            </div>
            <div class="table-responsive" *ngIf="!loadingAppts && patientAppointments.length > 0">
              <table class="table table-hover mb-0">
                <thead class="table-light"><tr>
                  <th>Date</th><th>Reason</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  <tr *ngFor="let a of patientAppointments.slice(0,5)">
                    <td>{{ a.date | date:'mediumDate' }}</td>
                    <td>{{ a.reason }}</td>
                    <td><span class="badge" [class]="statusBadge(a.status)">{{ a.status }}</span></td>
                    <td>
                      <a [routerLink]="['/appointments', a.id]" class="btn btn-sm btn-outline-secondary me-1">View</a>
                      <button *ngIf="a.status === 'scheduled'" class="btn btn-sm btn-outline-danger"
                        (click)="cancelAppointment(a)">Cancel</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white fw-semibold">Find a Doctor</div>
          <div class="card-body">
            <a routerLink="/doctors" class="btn btn-outline-primary">
              <i class="bi bi-person-badge me-1"></i> Browse Our Doctors
            </a>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  isDoctor = false;
  isPatient = false;

  doctorAppointments: Appointment[] = [];
  patientAppointments: Appointment[] = [];
  loadingAppts = false;

  medicationCount = 0;

  get scheduledCount() {
    const list = this.isDoctor ? this.doctorAppointments : this.patientAppointments;
    return list.filter(a => a.status === 'scheduled').length;
  }
  get completedCount() {
    return this.doctorAppointments.filter(a => a.status === 'completed').length;
  }

  constructor(
    private auth: AuthService,
    private apptSvc: AppointmentService,
    private medSvc: MedicationService
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => {
      this.user = u;
      this.isDoctor = u?.role === 'doctor';
      this.isPatient = u?.role === 'patient';
      if (this.isDoctor && u?.doctor_id) {
        this.loadDoctorData(u.doctor_id);
      } else if (this.isPatient && u?.patient_mongo_id) {
        this.loadPatientData(u.patient_mongo_id);
      }
    });
    this.medSvc.getAll().subscribe(r => this.medicationCount = r.count);
  }

  loadDoctorData(doctorId: number): void {
    this.loadingAppts = true;
    this.apptSvc.getAll({ doctor: doctorId.toString() }).subscribe(r => {
      this.doctorAppointments = r.results || r;
      this.loadingAppts = false;
    }, () => this.loadingAppts = false);
  }

  loadPatientData(patientId: string): void {
    this.loadingAppts = true;
    this.apptSvc.getAll({ patient: patientId }).subscribe(r => {
      this.patientAppointments = r.results || r;
      this.loadingAppts = false;
    }, () => this.loadingAppts = false);
  }

  cancelAppointment(a: Appointment): void {
    if (!a.id || !confirm('Cancel this appointment?')) return;
    this.apptSvc.update(a.id, { status: 'cancelled' }).subscribe(() => {
      a.status = 'cancelled';
    });
  }

  statusBadge(status?: string): string {
    if (status === 'scheduled') return 'badge-scheduled';
    if (status === 'completed') return 'badge-completed';
    if (status === 'cancelled') return 'badge-cancelled';
    return 'bg-secondary';
  }
}


