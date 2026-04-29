import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/models';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar navbar-expand-lg bg-white border-bottom px-4 py-2">
      <div class="d-flex align-items-center ms-auto gap-3">
        <ng-container *ngIf="user">
          <span class="badge rounded-pill"
            [class.bg-primary]="user.role === 'doctor'"
            [class.bg-success]="user.role === 'patient'">
            {{ user.role === 'doctor' ? 'Doctor' : 'Patient' }}
          </span>
          <span class="fw-semibold">
            <ng-container *ngIf="user.role === 'doctor'">Dr. </ng-container>
            {{ user.first_name || user.username }}
            <ng-container *ngIf="user.last_name"> {{ user.last_name }}</ng-container>
          </span>
          <img *ngIf="user.profile_image_url" [src]="user.profile_image_url"
            style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #dee2e6"
            alt="profile">
          <i *ngIf="!user.profile_image_url" class="bi bi-person-circle fs-5 text-secondary"></i>
        </ng-container>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  user: User | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => this.user = u);
  }
}
