import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RiskScore } from '../models/risk.model';

@Injectable({
  providedIn: 'root'
})
export class RiskService {
  private apiUrl = `${environment.apiUrl}/risk`;

  constructor(private http: HttpClient) {}

  /**
   * Calculate risk score for a case
   */
  calculateRiskScore(caseId: string): Observable<RiskScore> {
    return this.http.post<RiskScore>(`${this.apiUrl}/calculate/${caseId}`, {});
  }

  /**
   * Get current risk score for a case
   */
  getRiskScore(caseId: string): Observable<RiskScore> {
    return this.http.get<RiskScore>(`${this.apiUrl}/${caseId}`);
  }
}
