import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { Appointment } from '../../../models/models';

@Component({
  selector: 'app-appointment-detail',
  template: `
    <div class="page-header">
      <h3>Appointment Details</h3>
      <div class="d-flex gap-2">
        <!-- Patient actions -->
        <ng-container *ngIf="isPatient && appt?.status === 'scheduled'">
          <a [routerLink]="['/appointments', appt?.id, 'edit']" class="btn btn-outline-primary">
            <i class="bi bi-pencil me-1"></i> Edit
          </a>
          <button (click)="cancel()" class="btn btn-outline-danger">
            <i class="bi bi-x-circle me-1"></i> Cancel
          </button>
        </ng-container>

        <!-- Doctor actions -->
        <ng-container *ngIf="isDoctor">
          <a [routerLink]="['/appointments', appt?.id, 'edit']" class="btn btn-outline-primary">
            <i class="bi bi-pencil me-1"></i> Edit
          </a>
          <button *ngIf="appt?.status === 'scheduled'" (click)="markComplete()" class="btn btn-success">
            <i class="bi bi-check-circle me-1"></i> Mark Complete
          </button>
          <button (click)="delete()" class="btn btn-outline-danger">
            <i class="bi bi-trash me-1"></i> Delete
          </button>
        </ng-container>

        <a routerLink="/appointments" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Back
        </a>
      </div>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div class="row g-4" *ngIf="appt && !loading">
      <!-- Main Info -->
      <div class="col-md-8">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white fw-semibold">
            <span class="badge me-2" [class]="statusBadge(appt.status)">{{ appt.status }}</span>
            Appointment on {{ appt.date | date:'fullDate' }}
          </div>
          <div class="card-body">
            <div class="row mb-2">
              <div class="col-4 text-muted">Reason</div>
              <div class="col-8 fw-semibold">{{ appt.reason }}</div>
            </div>
            <div class="row mb-2">
              <div class="col-4 text-muted">Duration</div>
              <div class="col-8">{{ appt.duration }} minutes</div>
            </div>
            <div class="row mb-2">
              <div class="col-4 text-muted">First Visit</div>
              <div class="col-8">
                <span class="badge" [class.bg-success]="appt.is_first_visit" [class.bg-secondary]="!appt.is_first_visit">
                  {{ appt.is_first_visit ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
            <div class="row mb-2">
              <div class="col-4 text-muted">Contact Email</div>
              <div class="col-8">{{ appt.contact_email }}</div>
            </div>
            <div class="row mb-2" *ngIf="appt.symptoms">
              <div class="col-4 text-muted">Symptoms</div>
              <div class="col-8">{{ appt.symptoms }}</div>
            </div>
            <div class="row mb-2" *ngIf="appt.notes">
              <div class="col-4 text-muted">Doctor Notes</div>
              <div class="col-8 fst-italic">{{ appt.notes }}</div>
            </div>
          </div>
        </div>

        <!-- Medications -->
        <div class="card border-0 shadow-sm" *ngIf="appt.medications_detail && appt.medications_detail.length > 0">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-capsule me-2"></i>Prescribed Medications
          </div>
          <div class="list-group list-group-flush">
            <div class="list-group-item d-flex justify-content-between" *ngFor="let m of appt.medications_detail">
              <span>{{ m.name }}</span>
              <span class="badge bg-info bg-opacity-10 text-info">{{ m.dosage }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: Patient & Doctor -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm mb-3" *ngIf="appt.patient_detail">
          <div class="card-body">
            <h6 class="fw-semibold mb-2"><i class="bi bi-person me-1 text-success"></i>Patient</h6>
            <div class="fw-semibold">
              <a *ngIf="isDoctor" [routerLink]="['/patients', appt.patient_detail.id]">
                {{ appt.patient_detail.name }}
              </a>
              <span *ngIf="!isDoctor">{{ appt.patient_detail.name }}</span>
            </div>
            <small class="text-muted">{{ appt.patient_detail.email }}</small>
          </div>
        </div>

        <div class="card border-0 shadow-sm" *ngIf="appt.doctor_detail">
          <div class="card-body">
            <h6 class="fw-semibold mb-2"><i class="bi bi-person-badge me-1 text-primary"></i>Doctor</h6>
            <div class="d-flex align-items-center gap-3">
              <img *ngIf="appt.doctor_detail.profile_image_url"
                [src]="appt.doctor_detail.profile_image_url"
                class="avatar-sm" alt="doctor">
              <div>
                <div class="fw-semibold">
                  <a [routerLink]="['/doctors', appt.doctor_detail.id]">
                    Dr. {{ appt.doctor_detail.name }}
                  </a>
                </div>
                <small class="text-muted">{{ appt.doctor_detail.specialty }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AppointmentDetailComponent implements OnInit {
  appt?: Appointment;
  loading = true;
  isDoctor = false;
  isPatient = false;

  constructor(
    private route: ActivatedRoute,
    private svc: AppointmentService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    this.isPatient = this.auth.isPatient();
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe(a => {
      this.appt = a;
      this.loading = false;
    }, () => this.loading = false);
  }

  cancel(): void {
    if (!confirm('Cancel this appointment?')) return;
    this.svc.update(this.appt!.id!, { status: 'cancelled' }).subscribe(() => {
      this.appt!.status = 'cancelled';
    });
  }

  markComplete(): void {
    this.svc.update(this.appt!.id!, { status: 'completed' }).subscribe(() => {
      this.appt!.status = 'completed';
    });
  }

  delete(): void {
    if (!confirm('Delete this appointment permanently?')) return;
    this.svc.delete(this.appt!.id!).subscribe(() => this.router.navigate(['/appointments']));
  }

  statusBadge(status?: string): string {
    if (status === 'scheduled') return 'badge-scheduled';
    if (status === 'completed') return 'badge-completed';
    if (status === 'cancelled') return 'badge-cancelled';
    return 'bg-secondary';
  }
}


