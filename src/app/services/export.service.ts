import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private apiUrl = `${environment.apiUrl}/export`;

  constructor(private http: HttpClient) {}

  /**
   * Export all cases to CSV
   */
  exportAllCasesToCsv(): void {
    this.downloadFile(`${this.apiUrl}/cases/csv`, 'merchant_cases.csv');
  }

  /**
   * Export a single case to CSV
   */
  exportCaseToCsv(caseId: string): void {
    this.downloadFile(`${this.apiUrl}/case/${caseId}/csv`, `case_${caseId}.csv`);
  }

  /**
   * Export all cases to PDF
   */
  exportAllCasesToPdf(): void {
    this.downloadFile(`${this.apiUrl}/cases/pdf`, 'merchant_cases_report.pdf');
  }

  /**
   * Export a single case to PDF
   */
  exportCaseToPdf(caseId: string): void {
    this.downloadFile(`${this.apiUrl}/case/${caseId}/pdf`, `case_${caseId}_report.pdf`);
  }

  private downloadFile(url: string, filename: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        console.error('Error downloading file:', error);
      }
    });
  }
}
