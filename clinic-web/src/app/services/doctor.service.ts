import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Doctor, PaginatedResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private url = `${environment.apiUrl}/doctors/`;

  constructor(private http: HttpClient) {}

  getAll(params: Record<string, string> = {}): Observable<PaginatedResponse<Doctor>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    return this.http.get<PaginatedResponse<Doctor>>(this.url, { params: httpParams });
  }

  getById(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.url}${id}/`);
  }

  create(data: FormData): Observable<Doctor> {
    return this.http.post<Doctor>(this.url, data);
  }

  update(id: number, data: FormData): Observable<Doctor> {
    return this.http.patch<Doctor>(`${this.url}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }

  getAppointments(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}${id}/appointments/`);
  }
}
