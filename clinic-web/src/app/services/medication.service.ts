import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Medication, PaginatedResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private url = `${environment.apiUrl}/medications/`;

  constructor(private http: HttpClient) {}

  getAll(params: Record<string, string> = {}): Observable<PaginatedResponse<Medication>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, v); });
    return this.http.get<PaginatedResponse<Medication>>(this.url, { params: httpParams });
  }

  getById(id: number): Observable<Medication> {
    return this.http.get<Medication>(`${this.url}${id}/`);
  }

  create(data: Partial<Medication>): Observable<Medication> {
    return this.http.post<Medication>(this.url, data);
  }

  update(id: number, data: Partial<Medication>): Observable<Medication> {
    return this.http.patch<Medication>(`${this.url}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }
}
