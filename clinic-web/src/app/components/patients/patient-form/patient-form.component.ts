import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../services/patient.service';

@Component({
  selector: 'app-patient-form',
  template: `
    <div class="page-header">
      <h3>{{ isEdit ? 'Edit Patient' : 'Add Patient' }}</h3>
      <a routerLink="/patients" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </a>
    </div>

    <div class="card border-0 shadow-sm" style="max-width:680px">
      <div class="card-body p-4">
        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Full Name *</label>
              <input formControlName="name" class="form-control"
                [class.is-invalid]="submitted && f['name'].invalid">
              <div class="invalid-feedback">Name is required.</div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Date of Birth *</label>
              <input formControlName="date_of_birth" type="date" class="form-control"
                [class.is-invalid]="submitted && f['date_of_birth'].invalid">
              <div class="invalid-feedback">Date of birth is required.</div>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Email *</label>
              <input formControlName="email" type="email" class="form-control"
                [class.is-invalid]="submitted && f['email'].invalid">
              <div class="invalid-feedback">Valid email is required.</div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Phone</label>
              <input formControlName="phone" type="tel" class="form-control">
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Address</label>
            <textarea formControlName="address" class="form-control" rows="2"></textarea>
          </div>

          <!-- Image Upload -->
          <div class="mb-3">
            <label class="form-label">Profile Photo (Image)</label>
            <input type="file" class="form-control" accept="image/*"
              (change)="onImageSelected($event)">
            <div class="mt-2" *ngIf="imagePreview">
              <img [src]="imagePreview" class="rounded" style="height:80px;object-fit:cover" alt="preview">
            </div>
          </div>

          <!-- PDF Upload -->
          <div class="mb-4">
            <label class="form-label">Medical Report (PDF)</label>
            <input type="file" class="form-control" accept="application/pdf"
              (change)="onReportSelected($event)">
            <small *ngIf="reportFileName" class="text-muted d-block mt-1">
              <i class="bi bi-file-earmark-pdf text-danger me-1"></i>{{ reportFileName }}
            </small>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ isEdit ? 'Update' : 'Create' }} Patient
            </button>
            <a routerLink="/patients" class="btn btn-outline-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PatientFormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  isEdit = false;
  patientId?: string;
  selectedImage?: File;
  selectedReport?: File;
  imagePreview?: string;
  reportFileName?: string;

  constructor(
    private fb: FormBuilder,
    private svc: PatientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      date_of_birth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.patientId = id;
      this.svc.getById(this.patientId).subscribe(p => {
        this.form.patchValue(p);
        this.imagePreview = p.profile_image_url;
      });
    }
  }

  get f() { return this.form.controls; }

  onImageSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  onReportSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedReport = file;
    this.reportFileName = file.name;
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid) return;
    this.loading = true;

    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => fd.append(k, v as string));
    if (this.selectedImage) fd.append('profile_image', this.selectedImage);
    if (this.selectedReport) fd.append('medical_report', this.selectedReport);

    const req = this.isEdit
      ? this.svc.update(this.patientId!, fd)
      : this.svc.create(fd);

    req.subscribe({
      next: () => this.router.navigate(['/patients']),
      error: (err) => {
        this.error = JSON.stringify(err.error);
        this.loading = false;
      }
    });
  }
}
