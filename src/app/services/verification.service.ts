import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VerificationResult, VerificationSummary, VerificationType } from '../models/verification.model';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private apiUrl = `${environment.apiUrl}/verification`;

  constructor(private http: HttpClient) {}

  triggerAllVerifications(caseId: string): Observable<VerificationResult[]> {
    return this.http.post<VerificationResult[]>(`${this.apiUrl}/trigger/${caseId}`, {});
  }

  triggerVerification(caseId: string, verificationType: string): Observable<VerificationResult> {
    return this.http.post<VerificationResult>(`${this.apiUrl}/trigger/${caseId}/${verificationType}`, {});
  }

  getVerificationResults(caseId: string): Observable<VerificationResult[]> {
    return this.http.get<VerificationResult[]>(`${this.apiUrl}/${caseId}`);
  }

  getVerificationSummary(caseId: string): Observable<VerificationSummary> {
    return this.http.get<VerificationSummary>(`${this.apiUrl}/${caseId}/summary`);
  }

  getVerificationTypes(): Observable<VerificationType[]> {
    return this.http.get<VerificationType[]>(`${this.apiUrl}/types`);
  }
}
