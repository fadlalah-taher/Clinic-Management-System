import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient } from '../../../models/models';

@Component({
  selector: 'app-patient-list',
  template: `
    <div class="page-header">
      <h3>Patients</h3>
      <a *ngIf="!isDoctor" routerLink="/patients/new" class="btn btn-primary">
        <i class="bi bi-plus-circle me-1"></i> Add Patient
      </a>
    </div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body d-flex gap-2 flex-wrap align-items-center">
        <input [(ngModel)]="search" (ngModelChange)="load()" type="text"
          class="form-control search-bar" placeholder="Search name, email, phone...">
        <select [(ngModel)]="ordering" (ngModelChange)="load()" class="form-select" style="max-width:180px">
          <option value="name">Name A-Z</option>
          <option value="-name">Name Z-A</option>
          <option value="date_of_birth">Oldest DOB</option>
          <option value="-date_of_birth">Youngest DOB</option>
          <option value="-created_at">Newest First</option>
        </select>
      </div>
    </div>

    <div class="table-container">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th>Photo</th><th>Name</th><th>Email</th><th>Date of Birth</th><th>Phone</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of patients">
            <td>
              <img *ngIf="p.profile_image_url" [src]="p.profile_image_url" class="avatar-sm" alt="photo">
              <span *ngIf="!p.profile_image_url" class="badge bg-secondary">N/A</span>
            </td>
            <td>
              <a [routerLink]="['/patients', p.id]" class="fw-semibold text-decoration-none">
                {{ p.name }}
              </a>
            </td>
            <td>{{ p.email }}</td>
            <td>{{ p.date_of_birth }}</td>
            <td>{{ p.phone || '-' }}</td>
            <td>
              <a [routerLink]="['/patients', p.id]" class="btn btn-sm btn-outline-primary me-1">
                <i class="bi bi-eye"></i>
              </a>
              <ng-container *ngIf="!isDoctor">
                <a [routerLink]="['/patients', p.id, 'edit']" class="btn btn-sm btn-outline-secondary me-1">
                  <i class="bi bi-pencil"></i>
                </a>
                <button (click)="delete(p)" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </ng-container>
            </td>
          </tr>
          <tr *ngIf="patients.length === 0">
            <td colspan="6" class="text-center text-muted py-4">No patients found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="total > 10">
      <small class="text-muted">{{ total }} patients total</small>
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
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  total = 0;
  page = 1;
  next: string | null = null;
  prev: string | null = null;
  search = '';
  ordering = 'name';
  isDoctor = false;

  constructor(private svc: PatientService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    this.load();
  }

  load(): void {
    this.page = 1;
    this.svc.getAll({ search: this.search, ordering: this.ordering, page: '1' })
      .subscribe(r => {
        this.patients = r.results;
        this.total = r.count;
        this.next = r.next;
        this.prev = r.previous;
      });
  }

  changePage(delta: number): void {
    this.page += delta;
    this.svc.getAll({ search: this.search, ordering: this.ordering, page: String(this.page) })
      .subscribe(r => {
        this.patients = r.results;
        this.next = r.next;
        this.prev = r.previous;
      });
  }

  delete(p: Patient): void {
    if (!confirm(`Delete patient ${p.name}?`)) return;
    this.svc.delete(p.id!).subscribe(() => this.load());
  }
}
