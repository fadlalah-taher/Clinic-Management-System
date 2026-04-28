import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-doctor-form',
  template: `
    <div class="page-header">
      <h3>Edit My Profile</h3>
      <a routerLink="/doctors" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </a>
    </div>

    <div class="card border-0 shadow-sm" style="max-width:680px">
      <div class="card-body p-4">
        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
        <div *ngIf="success" class="alert alert-success">Profile updated successfully!</div>

        <form [formGroup]="form" (ngSubmit)="submit()" enctype="multipart/form-data">

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Full Name *</label>
              <input formControlName="name" class="form-control"
                [class.is-invalid]="submitted && f['name'].invalid">
              <div class="invalid-feedback">Name is required.</div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Specialty *</label>
              <select formControlName="specialty" class="form-select"
                [class.is-invalid]="submitted && f['specialty'].invalid">
                <option value="">Select specialty</option>
                <option value="cardiology">Cardiology</option>
                <option value="neurology">Neurology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="dermatology">Dermatology</option>
                <option value="general">General Practice</option>
                <option value="other">Other</option>
              </select>
              <div class="invalid-feedback">Specialty is required.</div>
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

          <!-- Image Upload -->
          <div class="mb-3">
            <label class="form-label">Profile Photo</label>
            <input type="file" class="form-control" accept="image/*"
              (change)="onImageSelected($event)">
            <div class="mt-2" *ngIf="imagePreview">
              <img [src]="imagePreview" class="rounded-circle" style="width:80px;height:80px;object-fit:cover" alt="preview">
            </div>
          </div>

          <!-- PDF Upload -->
          <div class="mb-4">
            <label class="form-label">CV Document (PDF)</label>
            <input type="file" class="form-control" accept="application/pdf"
              (change)="onCvSelected($event)">
            <small *ngIf="cvFileName" class="text-muted d-block mt-1">
              <i class="bi bi-file-earmark-pdf text-danger me-1"></i>{{ cvFileName }}
            </small>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              Save Changes
            </button>
            <a routerLink="/doctors" class="btn btn-outline-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class DoctorFormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  success = false;
  isEdit = false;
  doctorId?: number;
  selectedImage?: File;
  selectedCv?: File;
  imagePreview?: string;
  cvFileName?: string;

  constructor(
    private fb: FormBuilder,
    private svc: DoctorService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      specialty: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.doctorId = +id;
    } else if (this.auth.getDoctorId()) {
      // Auto-redirect to own profile edit
      this.isEdit = true;
      this.doctorId = this.auth.getDoctorId()!;
    }

    if (this.doctorId) {
      this.svc.getById(this.doctorId).subscribe(d => {
        this.form.patchValue(d);
        this.imagePreview = d.profile_image_url;
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

  onCvSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedCv = file;
    this.cvFileName = file.name;
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    this.success = false;
    if (this.form.invalid) return;
    this.loading = true;

    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => fd.append(k, v as string));
    if (this.selectedImage) fd.append('profile_image', this.selectedImage);
    if (this.selectedCv) fd.append('cv_document', this.selectedCv);

    const req = this.isEdit && this.doctorId
      ? this.svc.update(this.doctorId, fd)
      : this.svc.create(fd);

    req.subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => {
        const e = err.error;
        this.error = typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Error saving profile.';
        this.loading = false;
      }
    });
  }
}


