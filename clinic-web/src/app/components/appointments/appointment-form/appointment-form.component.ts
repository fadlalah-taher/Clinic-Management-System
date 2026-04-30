import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AppointmentService } from '../../../services/appointment.service';
import { DoctorService } from '../../../services/doctor.service';
import { MedicationService } from '../../../services/medication.service';
import { AuthService } from '../../../services/auth.service';
import { Doctor, Medication } from '../../../models/models';

@Component({
  selector: 'app-appointment-form',
  template: `
    <div class="page-header">
      <h3>{{ isEdit ? 'Edit Appointment' : 'Book Appointment' }}</h3>
      <a routerLink="/appointments" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </a>
    </div>

    <div class="card border-0 shadow-sm" style="max-width:780px">
      <div class="card-body p-4">
        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <!-- PATIENT creating a new appointment: choose doctor + fill date/reason -->
          <ng-container *ngIf="isPatient && !isEdit">
            <div class="mb-3">
              <label class="form-label">Doctor *</label>
              <select formControlName="doctor_id" class="form-select"
                [class.is-invalid]="submitted && f['doctor_id'].invalid">
                <option value="">Select a doctor</option>
                <option *ngFor="let d of doctors" [value]="d.id">
                  Dr. {{ d.name }} &mdash; {{ d.specialty | titlecase }}
                </option>
              </select>
              <div class="invalid-feedback">Please choose a doctor.</div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Appointment Date *</label>
                <input formControlName="date" type="date" class="form-control"
                  [class.is-invalid]="submitted && f['date'].invalid">
                <div class="invalid-feedback">Date is required.</div>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Contact Email *</label>
                <input formControlName="contact_email" type="email" class="form-control"
                  [class.is-invalid]="submitted && f['contact_email'].invalid">
                <div class="invalid-feedback">Valid email is required.</div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Reason for Visit *</label>
              <input formControlName="reason" class="form-control"
                placeholder="e.g. Annual checkup, chest pain..."
                [class.is-invalid]="submitted && f['reason'].invalid">
              <div class="invalid-feedback">Reason is required.</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Symptoms</label>
              <textarea formControlName="symptoms" class="form-control" rows="2"
                placeholder="Describe any symptoms..."></textarea>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Duration (min)</label>
                <input formControlName="duration" type="number" min="5" max="180" class="form-control">
              </div>
              <div class="col-md-4 mb-4 d-flex align-items-center">
                <div class="form-check mt-4">
                  <input formControlName="is_first_visit" type="checkbox" class="form-check-input" id="firstVisit">
                  <label class="form-check-label" for="firstVisit">First Visit</label>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- PATIENT editing their appointment (can only change date/reason/cancel) -->
          <ng-container *ngIf="isPatient && isEdit">
            <div class="alert alert-info py-2 small">
              <i class="bi bi-info-circle me-1"></i>
              You can update the date, reason, or cancel this appointment.
            </div>
            <div class="mb-3">
              <label class="form-label">Appointment Date *</label>
              <input formControlName="date" type="date" class="form-control"
                [class.is-invalid]="submitted && f['date'].invalid">
            </div>
            <div class="mb-3">
              <label class="form-label">Reason *</label>
              <input formControlName="reason" class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">Symptoms</label>
              <textarea formControlName="symptoms" class="form-control" rows="2"></textarea>
            </div>
          </ng-container>

          <!-- DOCTOR editing: status, notes, medications -->
          <ng-container *ngIf="isDoctor">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Appointment Date</label>
                <input formControlName="date" type="date" class="form-control">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Status</label>
                <select formControlName="status" class="form-select">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Reason</label>
              <input formControlName="reason" class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">Doctor Notes</label>
              <textarea formControlName="notes" class="form-control" rows="3"
                placeholder="Clinical notes, observations..."></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Prescribed Medications</label>
              <div class="border rounded p-2" style="max-height:160px;overflow-y:auto">
                <div class="form-check" *ngFor="let m of medications">
                  <input type="checkbox" class="form-check-input"
                    [id]="'med_' + m.id"
                    [checked]="isMedSelected(m.id!)"
                    (change)="toggleMed(m.id!)">
                  <label [for]="'med_' + m.id" class="form-check-label">
                    {{ m.name }} <small class="text-muted">({{ m.dosage }})</small>
                  </label>
                </div>
              </div>
            </div>
          </ng-container>

          <div class="d-flex gap-2 mt-2">
            <button type="submit" class="btn" [disabled]="loading"
              [class.btn-success]="isPatient && !isEdit"
              [class.btn-primary]="isEdit || isDoctor">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ isEdit ? 'Save Changes' : 'Book Appointment' }}
            </button>
            <a routerLink="/appointments" class="btn btn-outline-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AppointmentFormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  isEdit = false;
  apptId?: string;

  isDoctor = false;
  isPatient = false;

  doctors: Doctor[] = [];
  medications: Medication[] = [];
  selectedMeds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private svc: AppointmentService,
    private doctorSvc: DoctorService,
    private medSvc: MedicationService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isDoctor = this.auth.isDoctor();
    this.isPatient = this.auth.isPatient();

    this.form = this.fb.group({
      patient_id: [''],
      doctor_id: [''],
      date: ['', Validators.required],
      contact_email: [this.auth.getCurrentUser()?.email || '', [Validators.required, Validators.email]],
      reason: ['', Validators.required],
      status: ['scheduled'],
      duration: [30, [Validators.min(5), Validators.max(180)]],
      is_first_visit: [false],
      symptoms: [''],
      notes: ['']
    });

    if (this.isPatient) {
      this.form.get('doctor_id')?.setValidators(Validators.required);
      this.doctorSvc.getAll({ page_size: '1000' }).subscribe(r => {
        this.doctors = r.results || r;
        const preselect = this.route.snapshot.queryParamMap.get('doctor');
        if (preselect) {
          this.form.patchValue({ doctor_id: +preselect });
        }
      });
    }
    if (this.isDoctor) {
      this.medSvc.getAll({ page_size: '1000' }).subscribe(r => this.medications = r.results || r);
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.apptId = id;
      this.svc.getById(id).subscribe(a => {
        this.form.patchValue(a);
        this.selectedMeds = a.medication_ids || [];
      });
    }
  }

  get f() { return this.form.controls; }

  isMedSelected(id: number): boolean { return this.selectedMeds.includes(id); }

  toggleMed(id: number): void {
    const idx = this.selectedMeds.indexOf(id);
    if (idx === -1) this.selectedMeds.push(id);
    else this.selectedMeds.splice(idx, 1);
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid) return;
    this.loading = true;

    let payload: Record<string, any>;

    if (this.isPatient && !this.isEdit) {
      payload = {
        patient_id: this.auth.getPatientMongoId(),
        doctor_id: this.f['doctor_id'].value,
        date: this.f['date'].value,
        // contact_email: this.f['contact_email'].value,
        reason: this.f['reason'].value,
        symptoms: this.f['symptoms'].value,
        duration: this.f['duration'].value,
        is_first_visit: this.f['is_first_visit'].value,
        status: 'scheduled'
      };
    } else if (this.isPatient && this.isEdit) {
      payload = {
        date: this.f['date'].value,
        reason: this.f['reason'].value,
        symptoms: this.f['symptoms'].value
      };
    } else {
      payload = {
        ...this.form.value,
        medication_ids: this.selectedMeds
      };
    }

    const req = this.isEdit && this.apptId
      ? this.svc.update(this.apptId, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => this.router.navigate(['/appointments']),
      error: (err) => {
        const e = err.error;
        this.error = typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Error saving appointment.';
        this.loading = false;
      }
    });
  }
}


