import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <ng-container *ngIf="isLoggedIn; else authLayout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <app-navbar></app-navbar>
        <router-outlet></router-outlet>
      </div>
    </ng-container>
    <ng-template #authLayout>
      <router-outlet></router-outlet>
    </ng-template>
  `
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => this.isLoggedIn = !!user);
    if (this.auth.isLoggedIn()) {
      this.auth.fetchMe().subscribe();
    }
  }
}
