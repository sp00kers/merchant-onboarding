import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BusinessType, MerchantCategory, RiskCategory } from '../models/business-params.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessParamsService {
  private apiUrl = `${environment.apiUrl}/business-params`;

  constructor(private http: HttpClient) {}

  // ─── Business Types ───────────────────────────────────────

  getAllBusinessTypes(): Observable<BusinessType[]> {
    return this.http.get<BusinessType[]>(`${this.apiUrl}/business-types`).pipe(
      catchError(error => {
        console.error('Error fetching business types:', error);
        return of([]);
      })
    );
  }

  filterBusinessTypes(search?: string, status?: string): Observable<BusinessType[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);

    return this.http.get<BusinessType[]>(`${this.apiUrl}/business-types`, { params }).pipe(
      catchError(error => {
        console.error('Error filtering business types:', error);
        return of([]);
      })
    );
  }

  getBusinessTypeById(id: string): Observable<BusinessType | undefined> {
    return this.http.get<BusinessType>(`${this.apiUrl}/business-types/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching business type:', error);
        return of(undefined);
      })
    );
  }

  createBusinessType(data: Partial<BusinessType>): Observable<BusinessType> {
    return this.http.post<BusinessType>(`${this.apiUrl}/business-types`, data);
  }

  updateBusinessType(id: string, data: Partial<BusinessType>): Observable<BusinessType> {
    return this.http.put<BusinessType>(`${this.apiUrl}/business-types/${id}`, data);
  }

  deleteBusinessType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/business-types/${id}`);
  }

  // ─── Merchant Categories ──────────────────────────────────

  getAllMerchantCategories(): Observable<MerchantCategory[]> {
    return this.http.get<MerchantCategory[]>(`${this.apiUrl}/merchant-categories`).pipe(
      catchError(error => {
        console.error('Error fetching merchant categories:', error);
        return of([]);
      })
    );
  }

  filterMerchantCategories(search?: string, status?: string, riskLevel?: string): Observable<MerchantCategory[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (riskLevel) params = params.set('riskLevel', riskLevel);

    return this.http.get<MerchantCategory[]>(`${this.apiUrl}/merchant-categories`, { params }).pipe(
      catchError(error => {
        console.error('Error filtering merchant categories:', error);
        return of([]);
      })
    );
  }

  getMerchantCategoryById(id: string): Observable<MerchantCategory | undefined> {
    return this.http.get<MerchantCategory>(`${this.apiUrl}/merchant-categories/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching merchant category:', error);
        return of(undefined);
      })
    );
  }

  createMerchantCategory(data: Partial<MerchantCategory>): Observable<MerchantCategory> {
    return this.http.post<MerchantCategory>(`${this.apiUrl}/merchant-categories`, data);
  }

  updateMerchantCategory(id: string, data: Partial<MerchantCategory>): Observable<MerchantCategory> {
    return this.http.put<MerchantCategory>(`${this.apiUrl}/merchant-categories/${id}`, data);
  }

  deleteMerchantCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/merchant-categories/${id}`);
  }

  // ─── Risk Categories ──────────────────────────────────────

  getAllRiskCategories(): Observable<RiskCategory[]> {
    return this.http.get<RiskCategory[]>(`${this.apiUrl}/risk-categories`).pipe(
      catchError(error => {
        console.error('Error fetching risk categories:', error);
        return of([]);
      })
    );
  }

  filterRiskCategories(search?: string): Observable<RiskCategory[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<RiskCategory[]>(`${this.apiUrl}/risk-categories`, { params }).pipe(
      catchError(error => {
        console.error('Error filtering risk categories:', error);
        return of([]);
      })
    );
  }

  getRiskCategoryById(id: string): Observable<RiskCategory | undefined> {
    return this.http.get<RiskCategory>(`${this.apiUrl}/risk-categories/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching risk category:', error);
        return of(undefined);
      })
    );
  }

  createRiskCategory(data: Partial<RiskCategory>): Observable<RiskCategory> {
    return this.http.post<RiskCategory>(`${this.apiUrl}/risk-categories`, data);
  }

  updateRiskCategory(id: string, data: Partial<RiskCategory>): Observable<RiskCategory> {
    return this.http.put<RiskCategory>(`${this.apiUrl}/risk-categories/${id}`, data);
  }

  deleteRiskCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/risk-categories/${id}`);
  }

  // ─── Utility ──────────────────────────────────────────────

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY');
  }
}
