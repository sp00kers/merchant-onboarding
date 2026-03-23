import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuditLog, AuditLogPage, AuditStats } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = `${environment.apiUrl}/audit`;

  constructor(private http: HttpClient) {}

  getAuditLogs(
    page: number = 0,
    size: number = 20,
    filters?: {
      entityType?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<AuditLogPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.entityType) params = params.set('entityType', filters.entityType);
      if (filters.action) params = params.set('action', filters.action);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get<AuditLogPage>(this.apiUrl, { params });
  }

  getLogsForEntity(entityType: string, entityId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/entity/${entityType}/${entityId}`);
  }

  getLogsForUser(userId: string, page: number = 0, size: number = 20): Observable<AuditLogPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<AuditLogPage>(`${this.apiUrl}/user/${userId}`, { params });
  }

  getDistinctActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/actions`);
  }

  getDistinctEntityTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/entity-types`);
  }

  getAuditStats(): Observable<AuditStats> {
    return this.http.get<AuditStats>(`${this.apiUrl}/stats`);
  }
}
