import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  department: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsersByRole(roleId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/by-role/${roleId}`).pipe(
      catchError(error => {
        console.error('Error fetching users by role:', error);
        return of([]);
      })
    );
  }

  getComplianceReviewers(): Observable<User[]> {
    return forkJoin([
      this.getUsersByRole('compliance_reviewer'),
      this.getUsersByRole('admin')
    ]).pipe(
      map(([reviewers, admins]) => [...reviewers, ...admins])
    );
  }
}
