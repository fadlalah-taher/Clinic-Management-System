import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="page-header">
      <h3><i class="bi bi-person-circle me-2"></i>My Profile</h3>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div class="row g-4" *ngIf="!loading">
      <!-- Avatar card -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm text-center p-4">
          <div class="mb-3">
            <img *ngIf="profileImagePreview" [src]="profileImagePreview"
              class="rounded-circle mb-2"
              style="width:100px;height:100px;object-fit:cover;border:3px solid #e9ecef" alt="avatar">
            <div *ngIf="!profileImagePreview"
              class="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
              style="width:100px;height:100px;background:#e9ecef;font-size:2.5rem">
              <i class="bi" [class.bi-person-badge]="isDoctor" [class.bi-person-heart]="isPatient"
                [class.text-primary]="isDoctor" [class.text-success]="isPatient"></i>
            </div>
          </div>
          <div class="fw-bold">{{ profileData?.first_name || profileData?.username }}</div>
          <span class="badge mt-1" [class.bg-primary]="isDoctor" [class.bg-success]="isPatient">
            {{ isDoctor ? 'Doctor' : 'Patient' }}
          </span>
          <div class="text-muted small mt-2">{{ profileData?.email }}</div>

          <!-- Doctor specialty -->
          <div *ngIf="isDoctor && profileData?.doctor_specialty"
            class="mt-2 text-muted small">
            <i class="bi bi-award me-1"></i>{{ profileData?.doctor_specialty | titlecase }}
          </div>

          <!-- Patient documents summary -->
          <div *ngIf="isPatient" class="mt-3 text-start">
            <div class="small fw-semibold text-muted mb-1">Documents</div>
            <div class="d-flex align-items-center gap-1 small mb-1">
              <i class="bi" [class.bi-check-circle-fill]="profileData?.health_book_url"
                [class.text-success]="profileData?.health_book_url"
                [class.bi-x-circle]="!profileData?.health_book_url"
                [class.text-muted]="!profileData?.health_book_url"></i>
              Health Book
              <a *ngIf="profileData?.health_book_url" [href]="profileData?.health_book_url"
                target="_blank" class="ms-auto btn btn-sm btn-outline-secondary py-0 px-1">
                <i class="bi bi-download"></i>
              </a>
            </div>
          </div>

          <!-- Doctor documents summary -->
          <div *ngIf="isDoctor" class="mt-3 text-start">
            <div class="small fw-semibold text-muted mb-1">Documents</div>
            <div class="d-flex align-items-center gap-1 small mb-1">
              <i class="bi" [class.bi-check-circle-fill]="profileData?.cv_document_url"
                [class.text-success]="profileData?.cv_document_url"
                [class.bi-x-circle]="!profileData?.cv_document_url"
                [class.text-muted]="!profileData?.cv_document_url"></i>
              Doctor ID
              <a *ngIf="profileData?.cv_document_url" [href]="profileData?.cv_document_url"
                target="_blank" class="ms-auto btn btn-sm btn-outline-secondary py-0 px-1">
                <i class="bi bi-download"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit form -->
      <div class="col-md-9">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white fw-semibold">Edit Profile</div>
          <div class="card-body p-4">
            <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
            <div *ngIf="success" class="alert alert-success py-2">
              <i class="bi bi-check-circle-fill me-2"></i>Profile updated successfully!
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()">

              <!-- Account info -->
              <h6 class="text-muted fw-semibold mb-3 border-bottom pb-2">
                <i class="bi bi-person me-1"></i>Account Info
              </h6>
              <div class="row mb-3">
                <div class="col-md-6 mb-3 mb-md-0">
                  <label class="form-label">First Name</label>
                  <input formControlName="first_name" class="form-control">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Last Name</label>
                  <input formControlName="last_name" class="form-control">
                </div>
              </div>

              <!-- Profile Photo (both roles) -->
              <div class="mb-4">
                <label class="form-label">Profile Photo</label>
                <input type="file" class="form-control" accept="image/*"
                  (change)="onProfileImageSelected($event)">
                <small class="text-muted">JPG, PNG or GIF — max 5 MB</small>
              </div>

              <!-- ─── DOCTOR fields ─── -->
              <ng-container *ngIf="isDoctor">
                <h6 class="text-muted fw-semibold mb-3 border-bottom pb-2 mt-4">
                  <i class="bi bi-person-badge me-1"></i>Doctor Details
                </h6>
                <div class="row mb-3">
                  <div class="col-md-6 mb-3 mb-md-0">
                    <label class="form-label">Full Name</label>
                    <input formControlName="name" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone</label>
                    <input formControlName="phone" type="tel" class="form-control">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Specialty</label>
                  <select formControlName="specialty" class="form-select">
                    <option value="">Select specialty</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="general">General Practice</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label class="form-label">Doctor ID Document (PDF)</label>
                  <input type="file" class="form-control" accept="application/pdf"
                    (change)="onDoctorDocSelected($event)">
                  <div *ngIf="doctorDocFileName" class="mt-1 small">
                    <i class="bi bi-file-earmark-pdf text-danger me-1"></i>{{ doctorDocFileName }}
                  </div>
                  <div *ngIf="profileData?.cv_document_url && !doctorDocFileName"
                    class="mt-1 small text-success">
                    <i class="bi bi-check-circle me-1"></i>Document already uploaded.
                    <a [href]="profileData?.cv_document_url" target="_blank" class="ms-1">View</a>
                  </div>
                </div>
              </ng-container>

              <!-- ─── PATIENT fields ─── -->
              <ng-container *ngIf="isPatient">
                <h6 class="text-muted fw-semibold mb-3 border-bottom pb-2 mt-4">
                  <i class="bi bi-heart-pulse me-1"></i>Patient Details
                </h6>
                <div class="row mb-3">
                  <div class="col-md-6 mb-3 mb-md-0">
                    <label class="form-label">Full Name</label>
                    <input formControlName="patient_name" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Date of Birth</label>
                    <input formControlName="patient_dob" type="date" class="form-control">
                  </div>
                </div>
                <div class="row mb-3">
                  <div class="col-md-6 mb-3 mb-md-0">
                    <label class="form-label">Phone</label>
                    <input formControlName="patient_phone" type="tel" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Address</label>
                    <input formControlName="patient_address" class="form-control">
                  </div>
                </div>
                <div class="mb-4">
                  <label class="form-label">Health Book (PDF)</label>
                  <input type="file" class="form-control" accept="application/pdf"
                    (change)="onHealthBookSelected($event)">
                  <div *ngIf="selectedHealthBookName" class="mt-1 small">
                    <i class="bi bi-file-earmark-pdf text-danger me-1"></i>{{ selectedHealthBookName }}
                  </div>
                  <div *ngIf="profileData?.health_book_url && !selectedHealthBookName"
                    class="mt-1 small text-success">
                    <i class="bi bi-check-circle me-1"></i>Health book already uploaded.
                    <a [href]="profileData?.health_book_url" target="_blank" class="ms-1">View / Download</a>
                  </div>
                  <small class="text-muted">Upload your personal health record booklet as PDF.</small>
                </div>
              </ng-container>

              <button type="submit" class="btn btn-primary px-4" [disabled]="saveLoading">
                <span *ngIf="saveLoading" class="spinner-border spinner-border-sm me-2"></span>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saveLoading = false;
  error = '';
  success = false;

  profileData: any = null;
  isDoctor = false;
  isPatient = false;

  selectedProfileImage?: File;
  profileImagePreview?: string;

  // Doctor
  selectedDoctorDoc?: File;
  doctorDocFileName?: string;

  // Patient
  selectedHealthBook?: File;
  selectedHealthBookName?: string;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    this.isPatient = this.auth.isPatient();

    this.form = this.fb.group({
      first_name: [''],
      last_name: [''],
      // Doctor
      name: [''],
      specialty: [''],
      phone: [''],
      // Patient
      patient_name: [''],
      patient_phone: [''],
      patient_address: [''],
      patient_dob: [''],
    });

    this.auth.getProfile().subscribe({
      next: (data: any) => {
        this.profileData = data;
        this.form.patchValue({
          first_name: data.first_name || '',
          last_name:  data.last_name  || '',
          name:            data.doctor_name     || '',
          specialty:       data.doctor_specialty || '',
          phone:           data.doctor_phone    || '',
          patient_name:    data.patient_name    || '',
          patient_phone:   data.patient_phone   || '',
          patient_address: data.patient_address || '',
          patient_dob:     data.patient_dob     || '',
        });
        if (data.profile_image_url) {
          this.profileImagePreview = data.profile_image_url;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get f() { return this.form.controls; }

  onProfileImageSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedProfileImage = file;
    const reader = new FileReader();
    reader.onload = () => (this.profileImagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  onDoctorDocSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedDoctorDoc = file;
    this.doctorDocFileName = file.name;
  }

  onHealthBookSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedHealthBook = file;
    this.selectedHealthBookName = file.name;
  }

  submit(): void {
    this.error = '';
    this.success = false;
    this.saveLoading = true;

    const fd = new FormData();
    const v = this.form.value;

    if (v.first_name) fd.append('first_name', v.first_name);
    if (v.last_name)  fd.append('last_name',  v.last_name);

    if (this.isDoctor) {
      if (v.name)      fd.append('name',      v.name);
      if (v.specialty) fd.append('specialty', v.specialty);
      if (v.phone)     fd.append('phone',     v.phone);
      if (this.selectedProfileImage) fd.append('profile_image', this.selectedProfileImage);
      if (this.selectedDoctorDoc)    fd.append('cv_document',   this.selectedDoctorDoc);
    }

    if (this.isPatient) {
      if (v.patient_name)    fd.append('name',          v.patient_name);
      if (v.patient_phone)   fd.append('phone',         v.patient_phone);
      if (v.patient_address) fd.append('address',       v.patient_address);
      if (v.patient_dob)     fd.append('date_of_birth', v.patient_dob);
      if (this.selectedProfileImage) fd.append('profile_image', this.selectedProfileImage);
      if (this.selectedHealthBook)   fd.append('health_book',   this.selectedHealthBook);
    }

    this.auth.updateProfile(fd).subscribe({
      next: (data: any) => {
        this.profileData = data;
        if (data.profile_image_url) this.profileImagePreview = data.profile_image_url;
        this.success = true;
        this.saveLoading = false;
        // Reset file selections after save
        this.selectedDoctorDoc = undefined;
        this.doctorDocFileName = undefined;
        this.selectedHealthBook = undefined;
        this.selectedHealthBookName = undefined;
      },
      error: (err: any) => {
        const e = err.error;
        this.error = typeof e === 'object'
          ? (Object.values(e).flat() as string[]).join(' ')
          : 'Error updating profile.';
        this.saveLoading = false;
      }
    });
  }
}
