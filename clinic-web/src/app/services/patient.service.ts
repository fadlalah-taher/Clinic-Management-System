import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PaginatedResponse, Appointment } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private url = `${environment.apiUrl}/patients/`;

  constructor(private http: HttpClient) {}

  getAll(params: Record<string, string> = {}): Observable<PaginatedResponse<Patient>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    return this.http.get<PaginatedResponse<Patient>>(this.url, { params: httpParams });
  }

  getById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.url}${id}/`);
  }

  create(data: FormData | Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(this.url, data);
  }

  update(id: string, data: FormData | Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${this.url}${id}/`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }

  getAppointments(id: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.url}${id}/appointments/`);
  }
}
