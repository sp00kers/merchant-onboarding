import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Case, RoleBanner } from '../models/case.model';
import { environment } from '../../environments/environment';

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

  updateCase(caseId: string, caseData: Partial<Case>): Observable<Case> {
    return this.http.put<Case>(`${this.apiUrl}/${caseId}`, caseData);
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

  getRoleBanner(roleId: string, context: 'list' | 'detail'): RoleBanner | null {
    const banners: Record<string, Record<string, RoleBanner>> = {
      onboarding_officer: {
        list: {
          icon: '👁️',
          title: 'Onboarding Officer Mode',
          message: 'You can view all cases and create new ones. Click "View" to review case details and take actions where permitted.',
          bannerClass: 'info-banner'
        },
        detail: {
          icon: 'ℹ️',
          title: 'Onboarding Officer Access',
          message: 'You can view case details and add comments. For approvals or rejections, please contact a Compliance Reviewer.',
          bannerClass: 'info-banner'
        }
      },
      compliance_reviewer: {
        list: {
          icon: '✏️',
          title: 'Compliance Reviewer Mode',
          message: 'You can view and manage all cases. Click "View" to review case details and approve, reject, or request more information.',
          bannerClass: 'success-banner'
        },
        detail: {
          icon: '✏️',
          title: 'Compliance Reviewer Access',
          message: 'You can view, approve, reject, or request more information for this case. You have full control over the compliance review process.',
          bannerClass: 'success-banner'
        }
      },
      verifier: {
        list: {
          icon: '🔍',
          title: 'Verifier Mode',
          message: 'You can view cases for verification purposes. Click "View" to review case details and perform background verification tasks.',
          bannerClass: 'warning-banner'
        },
        detail: {
          icon: '🔍',
          title: 'Verifier Access',
          message: 'You can view case details and perform background verification tasks. Contact Compliance Reviewers for case status changes.',
          bannerClass: 'warning-banner'
        }
      },
      admin: {
        list: {
          icon: '⚙️',
          title: 'Administrator Mode',
          message: 'You have full system access. Click "View" to review case details and perform all available actions.',
          bannerClass: 'admin-banner'
        },
        detail: {
          icon: '⚙️',
          title: 'Administrator Access',
          message: 'You have full access to all case functions including approval, rejection, and case management.',
          bannerClass: 'admin-banner'
        }
      }
    };

    return banners[roleId]?.[context] || null;
  }
}
