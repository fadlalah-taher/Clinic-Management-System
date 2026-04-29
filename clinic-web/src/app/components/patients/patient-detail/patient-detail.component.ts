import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient, Appointment } from '../../../models/models';

@Component({
  selector: 'app-patient-detail',
  template: `
    <div class="page-header">
      <h3>Patient Profile</h3>
      <div class="d-flex gap-2">
        <a *ngIf="!isDoctor" [routerLink]="['/patients', patient?.id, 'edit']" class="btn btn-outline-primary">
          <i class="bi bi-pencil me-1"></i> Edit
        </a>
        <a routerLink="/patients" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Back
        </a>
      </div>
    </div>

    <div class="row g-4" *ngIf="patient">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center p-4">
          <div class="mb-3">
            <img *ngIf="patient.profile_image_url" [src]="patient.profile_image_url"
              class="rounded-circle" style="width:110px;height:110px;object-fit:cover" alt="photo">
            <div *ngIf="!patient.profile_image_url"
              class="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center"
              style="width:110px;height:110px">
              <i class="bi bi-person fs-1 text-success"></i>
            </div>
          </div>
          <h5 class="mb-1">{{ patient.name }}</h5>
          <div class="text-start mt-3">
            <div class="mb-2"><i class="bi bi-envelope text-muted me-2"></i>{{ patient.email }}</div>
            <div class="mb-2" *ngIf="patient.phone"><i class="bi bi-telephone text-muted me-2"></i>{{ patient.phone }}</div>
            <div class="mb-2"><i class="bi bi-calendar text-muted me-2"></i>DOB: {{ patient.date_of_birth }}</div>
            <div class="mb-2" *ngIf="patient.address"><i class="bi bi-geo-alt text-muted me-2"></i>{{ patient.address }}</div>
            <div class="mt-3" *ngIf="patient.medical_report_url">
              <a [href]="patient.medical_report_url" target="_blank" class="btn btn-outline-danger btn-sm w-100">
                <i class="bi bi-file-earmark-pdf me-1"></i> View Medical Report (PDF)
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-calendar-check me-2"></i>Appointments ({{ appointments.length }})
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Doctor</th><th>Date</th><th>Reason</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of appointments">
                  <td>Dr. {{ a.doctor_detail?.name }}</td>
                  <td>{{ a.date }}</td>
                  <td>{{ a.reason }}</td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + a.status">{{ a.status }}</span>
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
export class PatientDetailComponent implements OnInit {
  patient?: Patient;
  appointments: Appointment[] = [];
  isDoctor = false;

  constructor(private route: ActivatedRoute, private svc: PatientService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe(p => this.patient = p);
    this.svc.getAppointments(id).subscribe(list => this.appointments = list);
  }
}
