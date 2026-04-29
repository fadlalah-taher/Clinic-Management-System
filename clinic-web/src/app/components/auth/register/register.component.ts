import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password')?.value;
  const pw2 = control.get('password2')?.value;
  return pw === pw2 ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-bg">
      <div class="card shadow-lg" style="width:520px;border-radius:1rem;max-height:90vh;overflow-y:auto">
        <div class="card-body p-5">
          <div class="text-center mb-4">
            <i class="bi bi-hospital-fill fs-1 text-primary"></i>
            <h4 class="mt-2 mb-0 fw-bold">Create Account</h4>
            <p class="text-muted small">Choose your role to get started</p>
          </div>

          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
          <div *ngIf="success" class="alert alert-success py-2 text-center">
            <i class="bi bi-check-circle-fill me-2"></i>
            Registration successful! <a routerLink="/login" class="fw-semibold">Sign in now</a>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!success">

            <!-- Role selection -->
            <div class="mb-4">
              <label class="form-label fw-semibold mb-2">I am registering as a...</label>
              <div class="row g-3">
                <div class="col-6">
                  <div class="role-card"
                    [class.selected]="f['role'].value === 'doctor'"
                    (click)="setRole('doctor')">
                    <i class="bi bi-person-badge fs-2 text-primary d-block mb-2"></i>
                    <strong>Doctor</strong>
                    <p class="text-muted small mb-0 mt-1">Manage your appointments and patients</p>
                  </div>
                </div>
                <div class="col-6">
                  <div class="role-card"
                    [class.selected-patient]="f['role'].value === 'patient'"
                    (click)="setRole('patient')">
                    <i class="bi bi-person-heart fs-2 text-success d-block mb-2"></i>
                    <strong>Patient</strong>
                    <p class="text-muted small mb-0 mt-1">Book and manage your appointments</p>
                  </div>
                </div>
              </div>
              <div class="text-danger small mt-1" *ngIf="submitted && f['role'].invalid">
                Please select a role.
              </div>
            </div>

            <!-- Common fields -->
            <div class="row">
              <div class="col-6 mb-3">
                <label class="form-label">First Name</label>
                <input formControlName="first_name" class="form-control" placeholder="John">
              </div>
              <div class="col-6 mb-3">
                <label class="form-label">Last Name</label>
                <input formControlName="last_name" class="form-control" placeholder="Doe">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Username *</label>
              <input formControlName="username" class="form-control"
                placeholder="Choose a username"
                [class.is-invalid]="submitted && f['username'].invalid">
              <div class="invalid-feedback">Username is required.</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Email *</label>
              <input formControlName="email" type="email" class="form-control"
                placeholder="your@email.com"
                [class.is-invalid]="submitted && f['email'].invalid">
              <div class="invalid-feedback">Valid email is required.</div>
            </div>

            <!-- Doctor-specific fields -->
            <ng-container *ngIf="f['role'].value === 'doctor'">
              <div class="row">
                <div class="col-6 mb-3">
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
                <div class="col-6 mb-3">
                  <label class="form-label">Phone</label>
                  <input formControlName="phone" type="tel" class="form-control" placeholder="+1 (555) 000-0000">
                </div>
              </div>
              <div class="row">
                <div class="col-6 mb-3">
                  <label class="form-label">Date of Birth</label>
                  <input formControlName="date_of_birth" type="date" class="form-control">
                </div>
              </div>
            </ng-container>

            <!-- Patient-specific fields -->
            <ng-container *ngIf="f['role'].value === 'patient'">
              <div class="row">
                <div class="col-6 mb-3">
                  <label class="form-label">Date of Birth *</label>
                  <input formControlName="date_of_birth" type="date" class="form-control"
                    [class.is-invalid]="submitted && f['date_of_birth'].invalid">
                  <div class="invalid-feedback">Date of birth is required.</div>
                </div>
                <div class="col-6 mb-3">
                  <label class="form-label">Phone</label>
                  <input formControlName="phone" type="tel" class="form-control" placeholder="+1 (555) 000-0000">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Address</label>
                <input formControlName="address" class="form-control" placeholder="Your address">
              </div>
            </ng-container>

            <div class="mb-3">
              <label class="form-label">Password *</label>
              <div class="input-group">
                <input formControlName="password" [type]="showPw ? 'text' : 'password'"
                  class="form-control" placeholder="Min. 8 characters"
                  [class.is-invalid]="submitted && f['password'].invalid">
                <button type="button" class="btn btn-outline-secondary"
                  (click)="showPw = !showPw">
                  <i class="bi" [class.bi-eye]="!showPw" [class.bi-eye-slash]="showPw"></i>
                </button>
              </div>
              <div class="text-danger small mt-1" *ngIf="submitted && f['password'].invalid">
                Minimum 8 characters required.
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label">Confirm Password *</label>
              <input formControlName="password2" type="password" class="form-control"
                placeholder="Repeat password"
                [class.is-invalid]="submitted && (f['password2'].invalid || form.hasError('passwordsMismatch'))">
              <div class="text-danger small mt-1"
                *ngIf="submitted && (f['password2'].invalid || form.hasError('passwordsMismatch'))">
                Passwords do not match.
              </div>
            </div>

            <button type="submit" class="btn w-100 py-2 fw-semibold"
              [class.btn-primary]="f['role'].value === 'doctor'"
              [class.btn-success]="f['role'].value === 'patient'"
              [class.btn-secondary]="!f['role'].value"
              [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i class="bi bi-person-plus me-1"></i>
              Register as {{ f['role'].value === 'doctor' ? 'Doctor' : f['role'].value === 'patient' ? 'Patient' : '...' }}
            </button>
          </form>

          <hr class="my-3">
          <p class="text-center mb-0 small">
            Already have an account? <a routerLink="/login" class="fw-semibold">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  success = false;
  showPw = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      role: ['', Validators.required],
      first_name: [''],
      last_name: [''],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      specialty: [''],
      phone: [''],
      date_of_birth: [''],
      address: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password2: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  get f() { return this.form.controls; }

  setRole(role: 'doctor' | 'patient'): void {
    this.form.patchValue({ role });
    // Reset role-specific fields
    if (role === 'doctor') {
      this.form.patchValue({ date_of_birth: '', address: '' });
    } else {
      this.form.patchValue({ specialty: '' });
    }
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid) return;

    const role = this.f['role'].value;
    if (role === 'doctor' && !this.f['specialty'].value) {
      this.error = 'Please select your specialty.';
      return;
    }
    if (role === 'patient' && !this.f['date_of_birth'].value) {
      this.error = 'Date of birth is required for patients.';
      return;
    }

    this.loading = true;
    const payload = { ...this.form.value };
    if (role === 'doctor') { delete payload['address']; }
    if (role === 'patient') { delete payload['specialty']; delete payload['phone']; }
    this.auth.register(payload).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => {
        const e = err.error;
        if (typeof e === 'object') {
          this.error = Object.values(e).flat().join(' ');
        } else {
          this.error = 'Registration failed. Please try again.';
        }
        this.loading = false;
      }
    });
  }
}
