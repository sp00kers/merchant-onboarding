import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { Role } from '../models/role.model';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  roleId: string;
  department: string;
  phone: string;
  status: string;
  lastLogin: string;
  role: {
    id: string;
    name: string;
    description: string;
    permissions: string[];
  };
  permissions: string[];
}

export interface AuthResponse {
  token: string;
  type: string;
  user: UserInfo;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'currentUser';
  private readonly USER_ROLE_KEY = 'userRole';

  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load user from localStorage on service init
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username: email, password })
      .pipe(
        tap(response => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response));
          localStorage.setItem(this.USER_ROLE_KEY, response.user.roleId);
          this.currentUserSubject.next(response);
        })
      );
  }

  // Legacy method for backwards compatibility with existing login component
  loginWithRole(roleId: string): void {
    localStorage.setItem(this.USER_ROLE_KEY, roleId);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.USER_ROLE_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentRoleId(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  getCurrentRoleName(): string {
    const user = this.getCurrentUser();
    return user?.user?.role ? user.user.role.name : 'Unknown Role';
  }

  hasPermission(permission: string): Observable<boolean> {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return of(false);
    return this.http.get<boolean>(`${environment.apiUrl}/roles/${roleId}/has-permission/${permission}`)
      .pipe(catchError(() => of(false)));
  }

  // Synchronous permission check for guards (uses cached role)
  hasPermissionSync(permission: string): boolean {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return false;
    // For admin role, allow all permissions
    if (roleId === 'admin') return true;
    return false; // Default to false, actual check should use async method
  }

  canViewCases(): boolean {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return false;
    return ['admin', 'onboarding_officer', 'compliance_reviewer', 'verifier'].includes(roleId);
  }

  canEditCases(): boolean {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return false;
    return ['admin', 'onboarding_officer', 'compliance_reviewer'].includes(roleId);
  }
}
