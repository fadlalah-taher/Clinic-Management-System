import { Component, OnInit } from '@angular/core';
import { MedicationService } from '../../../services/medication.service';
import { AuthService } from '../../../services/auth.service';
import { Medication } from '../../../models/models';

@Component({
  selector: 'app-medication-list',
  template: `
    <div class="page-header">
      <h3>Medications</h3>
      <a *ngIf="isDoctor" routerLink="/medications/new" class="btn btn-primary">
        <i class="bi bi-plus-circle me-1"></i> Add Medication
      </a>
    </div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body d-flex gap-2">
        <input [(ngModel)]="search" (ngModelChange)="load()" type="text"
          class="form-control search-bar" placeholder="Search name, dosage...">
        <select [(ngModel)]="ordering" (ngModelChange)="load()" class="form-select" style="max-width:160px">
          <option value="name">Name A-Z</option>
          <option value="-name">Name Z-A</option>
          <option value="-created_at">Newest</option>
        </select>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-sm-6 col-lg-4" *ngFor="let m of medications">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="card-title mb-1">{{ m.name }}</h6>
                <span class="badge bg-info bg-opacity-10 text-info">{{ m.dosage }}</span>
              </div>
              <div class="d-flex gap-1" *ngIf="isDoctor">
                <a [routerLink]="['/medications', m.id, 'edit']" class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-pencil"></i>
                </a>
                <button (click)="delete(m)" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <p class="card-text text-muted small mt-2 mb-0" *ngIf="m.description">
              {{ m.description }}
            </p>
          </div>
        </div>
      </div>
      <div class="col-12" *ngIf="medications.length === 0">
        <div class="text-center text-muted py-4">No medications found.</div>
      </div>
    </div>
  `
})
export class MedicationListComponent implements OnInit {
  medications: Medication[] = [];
  search = '';
  ordering = 'name';
  isDoctor = false;

  constructor(private svc: MedicationService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    this.load();
  }

  load(): void {
    this.svc.getAll({ search: this.search, ordering: this.ordering })
      .subscribe(r => this.medications = r.results || r);
  }

  delete(m: Medication): void {
    if (!confirm(`Delete ${m.name}?`)) return;
    this.svc.delete(m.id!).subscribe(() => this.load());
  }
}


