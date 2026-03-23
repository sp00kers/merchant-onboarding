import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Analytics } from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  /**
   * Get comprehensive dashboard analytics
   */
  getDashboardAnalytics(): Observable<Analytics> {
    return this.http.get<Analytics>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get analytics for a specific date range
   */
  getAnalyticsByRange(startDate: string, endDate: string): Observable<Analytics> {
    return this.http.get<Analytics>(`${this.apiUrl}/range`, {
      params: { startDate, endDate }
    });
  }
}
