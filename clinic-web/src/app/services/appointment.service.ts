import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Appointment, PaginatedResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private url = `${environment.apiUrl}/appointments/`;

  constructor(private http: HttpClient) {}

  getAll(params: Record<string, string> = {}): Observable<PaginatedResponse<Appointment>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    return this.http.get<PaginatedResponse<Appointment>>(this.url, { params: httpParams });
  }

  getById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.url}${id}/`);
  }

  create(data: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(this.url, data);
  }

  update(id: string, data: Partial<Appointment>): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.url}${id}/`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }
}
