import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';
import { Doctor, Appointment } from '../../../models/models';

@Component({
  selector: 'app-doctor-detail',
  template: `
    <div class="page-header">
      <h3>Doctor Profile</h3>
      <div class="d-flex gap-2">
        <a *ngIf="isOwnProfile" [routerLink]="['/doctors', doctor?.id, 'edit']" class="btn btn-outline-primary">
          <i class="bi bi-pencil me-1"></i> Edit My Profile
        </a>
        <a routerLink="/doctors" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Back
        </a>
      </div>
    </div>

    <div class="row g-4" *ngIf="doctor">
      <!-- Profile Card -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center p-4">
          <div class="mb-3">
            <img *ngIf="doctor.profile_image_url" [src]="doctor.profile_image_url"
              class="rounded-circle" style="width:110px;height:110px;object-fit:cover" alt="photo">
            <div *ngIf="!doctor.profile_image_url" class="rounded-circle bg-primary bg-opacity-10 
              d-inline-flex align-items-center justify-content-center"
              style="width:110px;height:110px">
              <i class="bi bi-person-badge fs-1 text-primary"></i>
            </div>
          </div>
          <h5 class="mb-1">Dr. {{ doctor.name }}</h5>
          <span class="badge bg-primary bg-opacity-10 text-primary mb-3">{{ doctor.specialty }}</span>

          <div class="text-start">
            <div class="mb-2 d-flex gap-2 align-items-center">
              <i class="bi bi-envelope text-muted"></i>
              <span>{{ doctor.email }}</span>
            </div>
            <div class="mb-2 d-flex gap-2 align-items-center" *ngIf="doctor.phone">
              <i class="bi bi-telephone text-muted"></i>
              <span>{{ doctor.phone }}</span>
            </div>
            <div class="mt-3" *ngIf="doctor.cv_document_url">
              <a [href]="doctor.cv_document_url" target="_blank" class="btn btn-outline-danger btn-sm w-100">
                <i class="bi bi-file-earmark-pdf me-1"></i> View CV (PDF)
              </a>
            </div>

            <!-- Patient: Book with this doctor -->
            <div class="mt-3" *ngIf="isPatient">
              <a routerLink="/appointments/new" class="btn btn-success btn-sm w-100">
                <i class="bi bi-calendar-plus me-1"></i> Book with Dr. {{ (doctor.name || '').split(' ')[0] }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Appointments (doctor only) -->
      <div class="col-md-8" *ngIf="isDoctor">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-calendar-check me-2"></i>Appointments ({{ appointments.length }})
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Patient</th><th>Date</th><th>Reason</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of appointments">
                  <td>{{ a.patient_detail?.name }}</td>
                  <td>{{ a.date | date:'mediumDate' }}</td>
                  <td>{{ a.reason }}</td>
                  <td>
                    <span class="badge" [class]="statusBadge(a.status)">{{ a.status }}</span>
                  </td>
                  <td>
                    <a [routerLink]="['/appointments', a.id]" class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye"></i>
                    </a>
                  </td>
                </tr>
                <tr *ngIf="appointments.length === 0">
                  <td colspan="5" class="text-muted text-center py-3">No appointments.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DoctorDetailComponent implements OnInit {
  doctor?: Doctor;
  appointments: Appointment[] = [];
  isOwnProfile = false;
  isDoctor = false;
  isPatient = false;

  constructor(
    private route: ActivatedRoute,
    private svc: DoctorService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.isDoctor = this.auth.isDoctor();
    this.isPatient = this.auth.isPatient();
    this.isOwnProfile = this.auth.getDoctorId() === id;
    this.svc.getById(id).subscribe(d => this.doctor = d);
    if (this.isDoctor) {
      this.svc.getAppointments(id).subscribe(list => this.appointments = list);
    }
  }

  statusBadge(status?: string): string {
    if (status === 'scheduled') return 'badge-scheduled';
    if (status === 'completed') return 'badge-completed';
    if (status === 'cancelled') return 'badge-cancelled';
    return 'bg-secondary';
  }
}


