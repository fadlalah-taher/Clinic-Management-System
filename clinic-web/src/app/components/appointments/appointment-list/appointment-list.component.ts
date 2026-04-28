import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { Appointment } from '../../../models/models';

@Component({
  selector: 'app-appointment-list',
  template: `
    <div class="page-header">
      <h3>{{ isPatient ? 'My Appointments' : 'Appointments' }}</h3>
      <a *ngIf="isPatient" routerLink="/appointments/new" class="btn btn-success">
        <i class="bi bi-plus-circle me-1"></i> Book Appointment
      </a>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body d-flex gap-2 flex-wrap align-items-center">
        <input [(ngModel)]="search" (ngModelChange)="load()" type="text"
          class="form-control search-bar" placeholder="Search reason, symptoms...">

        <select [(ngModel)]="status" (ngModelChange)="load()" class="form-select" style="max-width:160px">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input [(ngModel)]="dateAfter" (ngModelChange)="load()" type="date"
          class="form-control" style="max-width:160px" title="From date">
        <input [(ngModel)]="dateBefore" (ngModelChange)="load()" type="date"
          class="form-control" style="max-width:160px" title="To date">

        <select [(ngModel)]="ordering" (ngModelChange)="load()" class="form-select" style="max-width:180px">
          <option value="-date">Newest Date</option>
          <option value="date">Oldest Date</option>
          <option value="status">Status</option>
        </select>
      </div>
    </div>

    <div class="table-container">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th>Date</th>
            <th *ngIf="isDoctor">Patient</th>
            <th *ngIf="isPatient">Doctor</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of appointments">
            <td>{{ a.date | date:'mediumDate' }}</td>
            <td *ngIf="isDoctor">{{ a.patient_detail?.name || '-' }}</td>
            <td *ngIf="isPatient">
              Dr. {{ a.doctor_detail?.name || '-' }}
            </td>
            <td>{{ a.reason }}</td>
            <td><span class="badge" [class]="statusBadge(a.status)">{{ a.status }}</span></td>
            <td>{{ a.duration }} min</td>
            <td>
              <a [routerLink]="['/appointments', a.id]" class="btn btn-sm btn-outline-primary me-1">
                <i class="bi bi-eye"></i>
              </a>
              <!-- Patient can edit/cancel their scheduled appointments -->
              <ng-container *ngIf="isPatient && a.status === 'scheduled'">
                <a [routerLink]="['/appointments', a.id, 'edit']" class="btn btn-sm btn-outline-secondary me-1">
                  <i class="bi bi-pencil"></i>
                </a>
                <button (click)="cancel(a)" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-x-circle"></i>
                </button>
              </ng-container>
              <!-- Doctor can view details and delete -->
              <ng-container *ngIf="isDoctor">
                <a [routerLink]="['/appointments', a.id, 'edit']" class="btn btn-sm btn-outline-secondary me-1">
                  <i class="bi bi-pencil"></i>
                </a>
                <button (click)="deleteAppt(a)" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </ng-container>
            </td>
          </tr>
          <tr *ngIf="appointments.length === 0 && !loading">
            <td colspan="7" class="text-center text-muted py-4">No appointments found.</td>
          </tr>
          <tr *ngIf="loading">
            <td colspan="7" class="text-center py-4"><div class="spinner-border text-primary"></div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="total > 10">
      <small class="text-muted">{{ total }} appointments</small>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" [disabled]="!prev" (click)="changePage(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="align-self-center small">Page {{ page }}</span>
        <button class="btn btn-sm btn-outline-secondary" [disabled]="!next" (click)="changePage(1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  `
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  total = 0;
  page = 1;
  next: string | null = null;
  prev: string | null = null;
  search = '';
  status = '';
  dateAfter = '';
  dateBefore = '';
  ordering = '-date';
  loading = false;

  isDoctor = false;
  isPatient = false;

  constructor(private svc: AppointmentService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    this.isPatient = this.auth.isPatient();
    this.load();
  }

  load(): void {
    this.page = 1;
    this.loading = true;
    const params: Record<string, string> = {
      search: this.search,
      status: this.status,
      date_after: this.dateAfter,
      date_before: this.dateBefore,
      ordering: this.ordering,
      page: '1'
    };
    if (this.isDoctor && this.auth.getDoctorId()) {
      params['doctor'] = this.auth.getDoctorId()!.toString();
    } else if (this.isPatient && this.auth.getPatientMongoId()) {
      params['patient'] = this.auth.getPatientMongoId()!;
    }
    this.svc.getAll(params).subscribe(r => {
      this.appointments = r.results || r;
      this.total = r.count || this.appointments.length;
      this.next = r.next;
      this.prev = r.previous;
      this.loading = false;
    }, () => this.loading = false);
  }

  changePage(delta: number): void {
    this.page += delta;
    this.svc.getAll({
      search: this.search,
      status: this.status,
      date_after: this.dateAfter,
      date_before: this.dateBefore,
      ordering: this.ordering,
      page: String(this.page)
    }).subscribe(r => {
      this.appointments = r.results || r;
      this.next = r.next;
      this.prev = r.previous;
    });
  }

  cancel(a: Appointment): void {
    if (!a.id || !confirm('Cancel this appointment?')) return;
    this.svc.update(a.id, { status: 'cancelled' }).subscribe(() => a.status = 'cancelled');
  }

  deleteAppt(a: Appointment): void {
    if (!a.id || !confirm('Delete this appointment?')) return;
    this.svc.delete(a.id).subscribe(() => this.load());
  }

  statusBadge(status?: string): string {
    if (status === 'scheduled') return 'badge-scheduled';
    if (status === 'completed') return 'badge-completed';
    if (status === 'cancelled') return 'badge-cancelled';
    return 'bg-secondary';
  }
}


