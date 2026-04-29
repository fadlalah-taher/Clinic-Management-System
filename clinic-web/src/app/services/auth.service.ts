import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'clinic_access';
  private readonly REFRESH_KEY = 'clinic_refresh';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login/`, { username, password })
      .pipe(
        tap(tokens => {
          localStorage.setItem(this.TOKEN_KEY, tokens.access);
          localStorage.setItem(this.REFRESH_KEY, tokens.refresh);
          this.fetchMe().subscribe();
        })
      );
  }

  register(data: Record<string, any>): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/register/`, data);
  }

  fetchMe(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me/`).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  /** GET full profile including file URLs and role-specific fields. */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/profile/`);
  }

  /** PATCH profile — accepts FormData with optional file fields. */
  updateProfile(data: FormData): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/auth/profile/`, data).pipe(
      tap(updated => {
        // Merge only the core User fields back into the subject
        const current = this.currentUserSubject.value;
        if (current) {
          this.currentUserSubject.next({ ...current, ...updated });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ── Role helpers ──────────────────────────────────────
  getRole(): string {
    return this.currentUserSubject.value?.role || '';
  }

  isDoctor(): boolean {
    return this.currentUserSubject.value?.role === 'doctor';
  }

  isPatient(): boolean {
    return this.currentUserSubject.value?.role === 'patient';
  }

  getDoctorId(): number | undefined {
    return this.currentUserSubject.value?.doctor_id;
  }

  getPatientMongoId(): string | undefined {
    return this.currentUserSubject.value?.patient_mongo_id;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}

