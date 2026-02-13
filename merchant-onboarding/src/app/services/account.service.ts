import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/role.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        return of([]);
      })
    );
  }

  getUserById(userId: string): Observable<User | undefined> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching user:', error);
        return of(undefined);
      })
    );
  }

  getUsersByRole(roleId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/by-role/${roleId}`).pipe(
      catchError(error => {
        console.error('Error fetching users by role:', error);
        return of([]);
      })
    );
  }

  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }

  updateUser(userId: string, updates: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, updates);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  toggleUserStatus(userId: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/toggle-status`, {});
  }

  getActiveUsersCount(): Observable<number> {
    return this.getAllUsers().pipe(
      map(users => users.filter(u => u.status === 'active').length)
    );
  }
}
