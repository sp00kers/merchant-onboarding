import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Case } from '../models/case.model';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  getAllCases(): Observable<Case[]> {
    return this.http.get<Case[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching cases:', error);
        return of([]);
      })
    );
  }

  getCaseById(caseId: string): Observable<Case | undefined> {
    return this.http.get<Case>(`${this.apiUrl}/${caseId}`).pipe(
      catchError(error => {
        console.error('Error fetching case:', error);
        return of(undefined);
      })
    );
  }

  filterCases(status?: string, search?: string): Observable<Case[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Case[]>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('Error filtering cases:', error);
        return of([]);
      })
    );
  }

  createCase(caseData: Partial<Case>): Observable<Case> {
    return this.http.post<Case>(this.apiUrl, caseData);
  }

  saveDraftCase(caseData: Partial<Case>): Observable<Case> {
    return this.http.post<Case>(`${this.apiUrl}/draft`, caseData);
  }

  updateCase(caseId: string, caseData: Partial<Case>): Observable<Case> {
    return this.http.put<Case>(`${this.apiUrl}/${caseId}`, caseData);
  }

  updateDraftCase(caseId: string, caseData: Partial<Case>): Observable<Case> {
    return this.http.put<Case>(`${this.apiUrl}/${caseId}/draft`, caseData);
  }

  deleteCase(caseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${caseId}`);
  }

  updateCaseStatus(caseId: string, status: string): Observable<Case> {
    return this.http.patch<Case>(`${this.apiUrl}/${caseId}/status`, { status });
  }

  addHistoryItem(caseId: string, action: string): Observable<Case> {
    return this.http.post<Case>(`${this.apiUrl}/${caseId}/history`, { action });
  }

  assignCase(caseId: string, assignedTo: string): Observable<Case> {
    return this.http.patch<Case>(`${this.apiUrl}/${caseId}/assign`, { assignedTo });
  }

  uploadDocuments(caseId: string, files: File[], types: string[]): Observable<Case> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    types.forEach(type => formData.append('types', type));
    return this.http.post<Case>(`${this.apiUrl}/${caseId}/documents`, formData);
  }

  downloadDocument(caseId: string, documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${caseId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
  }
}
