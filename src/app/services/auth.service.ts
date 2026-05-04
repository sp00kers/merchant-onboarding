import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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
  customPermissions?: string[];
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

  // Throttle: track last refresh time to avoid excessive API calls
  private lastRefreshTime = 0;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds
  private refreshInProgress = false;

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
    // Notify backend to clear active session token
    const token = this.getToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
        error: () => {} // Ignore errors — still proceed with client-side logout
      });
    }
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

  /**
   * Refresh current user data from backend (fetches fresh permissions).
   * Throttled to max once per 30 seconds.
   * Returns Observable<boolean> — true if refresh succeeded or was skipped (throttled).
   */
  refreshCurrentUser(): Observable<boolean> {
    if (!this.isLoggedIn() || !this.getToken()) {
      return of(false);
    }

    const now = Date.now();
    if (this.refreshInProgress || (now - this.lastRefreshTime < this.REFRESH_INTERVAL_MS)) {
      return of(true); // Skip — already refreshed recently or in progress
    }

    this.refreshInProgress = true;
    return this.http.get<UserInfo>(`${environment.apiUrl}/users/me`).pipe(
      map(freshUser => {
        // Check if user has been deactivated
        if (freshUser.status !== 'active') {
          this.refreshInProgress = false;
          this.forceLogout('Your account has been deactivated. Please contact an administrator.');
          return false;
        }
        // Rebuild the AuthResponse with fresh user data but keep existing token
        const currentAuth = this.getCurrentUser();
        if (currentAuth) {
          const updatedAuth: AuthResponse = {
            token: currentAuth.token,
            type: currentAuth.type,
            user: freshUser
          };
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(updatedAuth));
          sessionStorage.setItem(this.USER_ROLE_KEY, freshUser.roleId);
          this.currentUserSubject.next(updatedAuth);
        }
        this.lastRefreshTime = Date.now();
        this.refreshInProgress = false;
        return true;
      }),
      catchError((error) => {
        this.refreshInProgress = false;
        if (error.status === 401) {
          this.forceLogout('Your session has expired or your account has been deactivated.');
        }
        return of(false);
      })
    );
  }

  /**
   * Force logout without calling backend (session is already invalid).
   */
  forceLogout(message: string): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_ROLE_KEY);
    this.currentUserSubject.next(null);
    alert(message);
    this.router.navigate(['/login']);
  }

  /**
   * Validate session with backend immediately (bypasses throttle).
   * Used on app init/page refresh to catch deactivated users.
   */
  validateSession(): Observable<boolean> {
    if (!this.isLoggedIn() || !this.getToken()) {
      return of(false);
    }

    return this.http.get<UserInfo>(`${environment.apiUrl}/users/me`).pipe(
      map(freshUser => {
        if (freshUser.status !== 'active') {
          this.forceLogout('Your account has been deactivated. Please contact an administrator.');
          return false;
        }
        this.lastRefreshTime = Date.now();
        return true;
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.forceLogout('Your session has expired or your account has been deactivated.');
        }
        return of(false);
      })
    );
  }

  canViewCases(): boolean {
    return this.hasAnyPermission(['case_management', 'case_creation', 'all_modules']);
  }

  canEditCases(): boolean {
    return this.hasAnyPermission(['case_management', 'all_modules']);
  }
}
