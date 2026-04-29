import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/models';

@Component({
  selector: 'app-sidebar',
  template: `
    <nav class="sidebar d-flex flex-column" [class.patient-theme]="isPatient">
      <div class="brand">
        <i class="bi bi-hospital-fill me-2"></i>ClinicMS
        <span class="role-badge" *ngIf="user">{{ user.role }}</span>
      </div>

      <ul class="nav flex-column mt-2 flex-grow-1">
        <li class="nav-item">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
        </li>

        <!-- Doctor navigation -->
        <ng-container *ngIf="isDoctor">
          <li class="nav-item">
            <a routerLink="/appointments" routerLinkActive="active" class="nav-link">
              <i class="bi bi-calendar-check"></i> My Appointments
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/medications" routerLinkActive="active" class="nav-link">
              <i class="bi bi-capsule"></i> Medications
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/profile" routerLinkActive="active" class="nav-link">
              <i class="bi bi-person-gear"></i> My Profile
            </a>
          </li>
        </ng-container>

        <!-- Patient navigation -->
        <ng-container *ngIf="isPatient">
          <li class="nav-item">
            <a routerLink="/appointments" routerLinkActive="active" class="nav-link">
              <i class="bi bi-calendar-check"></i> My Appointments
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/appointments/new" routerLinkActive="active" class="nav-link">
              <i class="bi bi-plus-circle"></i> Book Appointment
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/doctors" routerLinkActive="active" class="nav-link">
              <i class="bi bi-person-badge"></i> Our Doctors
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/profile" routerLinkActive="active" class="nav-link">
              <i class="bi bi-person-gear"></i> My Profile
            </a>
          </li>
        </ng-container>
      </ul>

      <div class="p-3 border-top border-white border-opacity-10">
        <div class="text-white-50 small mb-2 px-1" *ngIf="user">
          <i class="bi bi-person-circle me-1"></i>
          {{ user.first_name || user.username }}
        </div>
        <button class="btn btn-outline-light btn-sm w-100" (click)="logout()">
          <i class="bi bi-box-arrow-right me-1"></i> Logout
        </button>
      </div>
    </nav>
  `
})
export class SidebarComponent implements OnInit {
  user: User | null = null;
  isDoctor = false;
  isPatient = false;
  doctorId?: number;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => {
      this.user = u;
      this.isDoctor = u?.role === 'doctor';
      this.isPatient = u?.role === 'patient';
      this.doctorId = u?.doctor_id;
    });
  }

  logout(): void { this.auth.logout(); }
}
