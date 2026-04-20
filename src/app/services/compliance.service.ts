import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ComplianceReviewResult, ComplianceReviewSummary } from '../models/verification.model';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private apiUrl = `${environment.apiUrl}/compliance`;

  constructor(private http: HttpClient) {}

  triggerAllReviews(caseId: string): Observable<ComplianceReviewResult[]> {
    return this.http.post<ComplianceReviewResult[]>(`${this.apiUrl}/trigger/${caseId}`, {});
  }

  triggerReview(caseId: string, documentType: string): Observable<ComplianceReviewResult> {
    return this.http.post<ComplianceReviewResult>(`${this.apiUrl}/trigger/${caseId}/${documentType}`, {});
  }

  getReviewResults(caseId: string): Observable<ComplianceReviewResult[]> {
    return this.http.get<ComplianceReviewResult[]>(`${this.apiUrl}/${caseId}`);
  }

  getReviewSummary(caseId: string): Observable<ComplianceReviewSummary> {
    return this.http.get<ComplianceReviewSummary>(`${this.apiUrl}/${caseId}/summary`);
  }
}
