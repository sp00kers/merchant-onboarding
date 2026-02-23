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
    // Load user from sessionStorage on service init
    const storedUser = sessionStorage.getItem(this.USER_KEY);
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username: email, password })
      .pipe(
        tap(response => {
          sessionStorage.setItem(this.TOKEN_KEY, response.token);
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(response));
          sessionStorage.setItem(this.USER_ROLE_KEY, response.user.roleId);
          this.currentUserSubject.next(response);
        })
      );
  }

  // Legacy method for backwards compatibility with existing login component
  loginWithRole(roleId: string): void {
    sessionStorage.setItem(this.USER_ROLE_KEY, roleId);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_ROLE_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem(this.USER_ROLE_KEY);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentRoleId(): string | null {
    return sessionStorage.getItem(this.USER_ROLE_KEY);
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

  // Synchronous permission check using cached user permissions
  hasPermissionSync(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user?.user) return false;

    // Check for ALL_MODULES permission (super admin access)
    if (user.user.permissions?.includes('all_modules')) return true;

    // Check specific permission (case-insensitive)
    const permissionLower = permission.toLowerCase();
    return user.user.permissions?.some(p => p.toLowerCase() === permissionLower) || false;
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermissionSync(p));
  }

  // Get all user permissions
  getUserPermissions(): string[] {
    const user = this.getCurrentUser();
    return user?.user?.permissions || [];
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
