import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DocumentExtraction } from '../models/document-extraction.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  /**
   * Trigger OCR extraction for a specific document
   */
  extractDocument(documentId: number): Observable<DocumentExtraction> {
    return this.http.post<DocumentExtraction>(`${this.apiUrl}/${documentId}/extract`, {});
  }

  /**
   * Get extraction results for a document
   */
  getExtraction(documentId: number): Observable<DocumentExtraction> {
    return this.http.get<DocumentExtraction>(`${this.apiUrl}/${documentId}/extraction`);
  }

  /**
   * Get all extractions for a case
   */
  getCaseExtractions(caseId: string): Observable<DocumentExtraction[]> {
    return this.http.get<DocumentExtraction[]>(`${this.apiUrl}/case/${caseId}/extractions`);
  }

  /**
   * Trigger extraction for all documents in a case
   */
  extractAllDocuments(caseId: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/case/${caseId}/extract-all`, {}, { responseType: 'text' });
  }
}
