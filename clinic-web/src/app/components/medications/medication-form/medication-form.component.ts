import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicationService } from '../../../services/medication.service';

@Component({
  selector: 'app-medication-form',
  template: `
    <div class="page-header">
      <h3>{{ isEdit ? 'Edit Medication' : 'Add Medication' }}</h3>
      <a routerLink="/medications" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </a>
    </div>

    <div class="card border-0 shadow-sm" style="max-width:560px">
      <div class="card-body p-4">
        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="mb-3">
            <label class="form-label">Medication Name *</label>
            <input formControlName="name" class="form-control"
              [class.is-invalid]="submitted && f['name'].invalid">
            <div class="invalid-feedback">Name is required.</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Dosage *</label>
            <input formControlName="dosage" class="form-control" placeholder="e.g. 500mg twice daily"
              [class.is-invalid]="submitted && f['dosage'].invalid">
            <div class="invalid-feedback">Dosage is required.</div>
          </div>

          <div class="mb-4">
            <label class="form-label">Description</label>
            <textarea formControlName="description" class="form-control" rows="3"
              placeholder="Additional notes or side effects..."></textarea>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ isEdit ? 'Update' : 'Create' }} Medication
            </button>
            <a routerLink="/medications" class="btn btn-outline-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MedicationFormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  isEdit = false;
  medId?: number;

  constructor(
    private fb: FormBuilder,
    private svc: MedicationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      dosage: ['', Validators.required],
      description: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.medId = +id;
      this.svc.getById(this.medId).subscribe(m => this.form.patchValue(m));
    }
  }

  get f() { return this.form.controls; }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid) return;
    this.loading = true;

    const req = this.isEdit
      ? this.svc.update(this.medId!, this.form.value)
      : this.svc.create(this.form.value);

    req.subscribe({
      next: () => this.router.navigate(['/medications']),
      error: (err) => {
        this.error = JSON.stringify(err.error);
        this.loading = false;
      }
    });
  }
}
