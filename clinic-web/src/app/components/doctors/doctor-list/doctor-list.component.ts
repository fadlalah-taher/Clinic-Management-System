import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';
import { Doctor } from '../../../models/models';

@Component({
  selector: 'app-doctor-list',
  template: `
    <div class="page-header">
      <h3>{{ isPatient ? 'Our Doctors' : 'Doctors' }}</h3>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body d-flex gap-2 flex-wrap align-items-center">
        <input [(ngModel)]="search" (ngModelChange)="load()" type="text"
          class="form-control search-bar" placeholder="Search name, email, specialty...">

        <select [(ngModel)]="specialty" (ngModelChange)="load()" class="form-select" style="max-width:180px">
          <option value="">All Specialties</option>
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
          <option value="orthopedics">Orthopedics</option>
          <option value="pediatrics">Pediatrics</option>
          <option value="dermatology">Dermatology</option>
          <option value="general">General Practice</option>
          <option value="other">Other</option>
        </select>

        <select [(ngModel)]="ordering" (ngModelChange)="load()" class="form-select" style="max-width:160px">
          <option value="name">Name A-Z</option>
          <option value="-name">Name Z-A</option>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
        </select>
      </div>
    </div>

    <!-- Cards for patients, table for doctors -->
    <ng-container *ngIf="isPatient">
      <div class="row g-3">
        <div class="col-md-6 col-xl-4" *ngFor="let d of doctors">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex gap-3 align-items-start">
              <img *ngIf="d.profile_image_url" [src]="d.profile_image_url" class="avatar-sm" alt="photo">
              <div *ngIf="!d.profile_image_url" class="avatar-sm bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center rounded-circle">
                <i class="bi bi-person"></i>
              </div>
              <div>
                <div class="fw-semibold">Dr. {{ d.name }}</div>
                <span class="badge bg-primary bg-opacity-10 text-primary small">{{ d.specialty }}</span>
                <div class="text-muted small mt-1">{{ d.email }}</div>
                <a routerLink="/appointments/new" class="btn btn-sm btn-success mt-2">
                  <i class="bi bi-calendar-plus me-1"></i> Book
                </a>
              </div>
            </div>
          </div>
        </div>
        <div *ngIf="doctors.length === 0" class="col-12 text-center text-muted py-4">No doctors found.</div>
      </div>
    </ng-container>

    <ng-container *ngIf="isDoctor">
      <div class="table-container">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Photo</th><th>Name</th><th>Specialty</th><th>Email</th><th>Phone</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of doctors">
              <td>
                <img *ngIf="d.profile_image_url" [src]="d.profile_image_url" class="avatar-sm" alt="photo">
                <span *ngIf="!d.profile_image_url" class="text-muted">-</span>
              </td>
              <td>
                <a [routerLink]="['/doctors', d.id]" class="fw-semibold text-decoration-none">
                  Dr. {{ d.name }}
                </a>
              </td>
              <td><span class="badge bg-primary bg-opacity-10 text-primary">{{ d.specialty }}</span></td>
              <td>{{ d.email }}</td>
              <td>{{ d.phone || '-' }}</td>
              <td>
                <!-- Edit own profile only -->
                <a *ngIf="d.id === myDoctorId" [routerLink]="['/doctors', d.id, 'edit']"
                  class="btn btn-sm btn-outline-secondary me-1">
                  <i class="bi bi-pencil"></i>
                </a>
                <a *ngIf="d.id !== myDoctorId" [routerLink]="['/doctors', d.id]"
                  class="btn btn-sm btn-outline-primary me-1">
                  <i class="bi bi-eye"></i>
                </a>
              </td>
            </tr>
            <tr *ngIf="doctors.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No doctors found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <!-- Pagination -->
    <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="total > 10">
      <small class="text-muted">{{ total }} doctors total</small>
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
export class DoctorListComponent implements OnInit {
  doctors: Doctor[] = [];
  total = 0;
  page = 1;
  next: string | null = null;
  prev: string | null = null;
  search = '';
  specialty = '';
  ordering = 'name';

  isDoctor = false;
  isPatient = false;
  myDoctorId?: number;

  constructor(private svc: DoctorService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    this.isPatient = this.auth.isPatient();
    this.myDoctorId = this.auth.getDoctorId() ?? undefined;
    this.load();
  }

  load(): void {
    this.page = 1;
    this.svc.getAll({
      search: this.search,
      specialty: this.specialty,
      ordering: this.ordering,
      page: String(this.page)
    }).subscribe(r => {
      this.doctors = r.results || r;
      this.total = r.count || this.doctors.length;
      this.next = r.next;
      this.prev = r.previous;
    });
  }

  changePage(delta: number): void {
    this.page += delta;
    this.svc.getAll({
      search: this.search,
      specialty: this.specialty,
      ordering: this.ordering,
      page: String(this.page)
    }).subscribe(r => {
      this.doctors = r.results || r;
      this.next = r.next;
      this.prev = r.previous;
    });
  }
}


