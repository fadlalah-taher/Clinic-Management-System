import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-bg">
      <div class="card shadow-lg" style="width:420px;border-radius:1rem">
        <div class="card-body p-5">
          <div class="text-center mb-4">
            <i class="bi bi-hospital-fill fs-1 text-primary"></i>
            <h4 class="mt-2 mb-0 fw-bold">ClinicMS</h4>
            <p class="text-muted small">Sign in to your account</p>
          </div>

          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="mb-3">
              <label class="form-label fw-semibold">Username</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input formControlName="username" type="text" class="form-control"
                  placeholder="Enter username"
                  [class.is-invalid]="submitted && f['username'].invalid">
              </div>
              <div class="text-danger small mt-1" *ngIf="submitted && f['username'].invalid">
                Username is required.
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-semibold">Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input formControlName="password" [type]="showPw ? 'text' : 'password'"
                  class="form-control" placeholder="Enter password"
                  [class.is-invalid]="submitted && f['password'].invalid">
                <button type="button" class="btn btn-outline-secondary"
                  (click)="showPw = !showPw">
                  <i class="bi" [class.bi-eye]="!showPw" [class.bi-eye-slash]="showPw"></i>
                </button>
              </div>
              <div class="text-danger small mt-1" *ngIf="submitted && f['password'].invalid">
                Password is required.
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              Sign In
            </button>
          </form>

          <hr class="my-3">
          <p class="text-center mb-0 small">
            No account? <a routerLink="/register" class="fw-semibold">Register here</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  form: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  showPw = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get f() { return this.form.controls; }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.f['username'].value, this.f['password'].value).subscribe({
      next: () => {
        // Navigate based on role once user is loaded
        const check = setInterval(() => {
          const role = this.auth.getRole();
          if (role) {
            clearInterval(check);
            this.router.navigate(['/dashboard']);
          }
        }, 100);
      },
      error: () => {
        this.error = 'Invalid username or password.';
        this.loading = false;
      }
    });
  }
}
