import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Permission, Role } from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  // Cache for roles and permissions
  private rolesCache: Role[] = [];
  private permissionsCache: Permission[] = [];

  constructor(private http: HttpClient) {}

  // ─── Role Methods ───────────────────────────────────────

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl).pipe(
      tap(roles => this.rolesCache = roles),
      catchError(error => {
        console.error('Error fetching roles:', error);
        return of([]);
      })
    );
  }

  getActiveRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/active`).pipe(
      catchError(error => {
        console.error('Error fetching active roles:', error);
        return of([]);
      })
    );
  }

  getRoleById(roleId: string): Observable<Role | undefined> {
    return this.http.get<Role>(`${this.apiUrl}/${roleId}`).pipe(
      catchError(error => {
        console.error('Error fetching role:', error);
        return of(undefined);
      })
    );
  }

  // Synchronous method for backwards compatibility (uses cache)
  getRoleByIdSync(roleId: string): Role | undefined {
    return this.rolesCache.find(role => role.id === roleId);
  }

  createRole(roleData: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, roleData).pipe(
      tap(role => this.rolesCache.push(role))
    );
  }

  updateRole(roleId: string, updates: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${roleId}`, updates).pipe(
      tap(updatedRole => {
        const index = this.rolesCache.findIndex(r => r.id === roleId);
        if (index !== -1) {
          this.rolesCache[index] = updatedRole;
        }
      })
    );
  }

  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roleId}`).pipe(
      tap(() => {
        this.rolesCache = this.rolesCache.filter(r => r.id !== roleId);
      })
    );
  }

  // ─── Permission Methods ───────────────────────────────────────

  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`).pipe(
      tap(permissions => this.permissionsCache = permissions),
      catchError(error => {
        console.error('Error fetching permissions:', error);
        return of([]);
      })
    );
  }

  getActivePermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions/active`).pipe(
      catchError(error => {
        console.error('Error fetching active permissions:', error);
        return of([]);
      })
    );
  }

  getPermissionsByCategory(category: string): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions/category/${category}`).pipe(
      catchError(error => {
        console.error('Error fetching permissions by category:', error);
        return of([]);
      })
    );
  }

  addPermission(permissionData: Partial<Permission>): Observable<Permission> {
    return this.http.post<Permission>(`${this.apiUrl}/permissions`, permissionData).pipe(
      tap(permission => this.permissionsCache.push(permission))
    );
  }

  updatePermission(permissionId: string, updates: Partial<Permission>): Observable<Permission> {
    return this.http.put<Permission>(`${this.apiUrl}/permissions/${permissionId}`, updates).pipe(
      tap(updatedPermission => {
        const index = this.permissionsCache.findIndex(p => p.id === permissionId);
        if (index !== -1) {
          this.permissionsCache[index] = updatedPermission;
        }
      })
    );
  }

  deletePermission(permissionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permissions/${permissionId}`).pipe(
      tap(() => {
        this.permissionsCache = this.permissionsCache.filter(p => p.id !== permissionId);
      })
    );
  }

  getPermissionById(permissionId: string): Observable<Permission | undefined> {
    return this.http.get<Permission>(`${this.apiUrl}/permissions/${permissionId}`).pipe(
      catchError(() => of(undefined))
    );
  }

  // Synchronous method for backwards compatibility (uses cache)
  getPermissionByIdSync(permissionId: string): Permission | undefined {
    return this.permissionsCache.find(p => p.id === permissionId);
  }

  // ─── Permission Check Methods ───────────────────────────────────────

  userHasPermission(roleId: string, requiredPermission: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${roleId}/has-permission/${requiredPermission}`).pipe(
      catchError(() => of(false))
    );
  }

  // Synchronous permission check (uses cache)
  userHasPermissionSync(roleId: string, requiredPermission: string): boolean {
    const role = this.rolesCache.find(r => r.id === roleId);
    if (!role) return false;
    if (role.permissions.includes('all_modules')) return true;
    return role.permissions.includes(requiredPermission);
  }

  canViewCases(roleId: string): boolean {
    return this.userHasPermissionSync(roleId, 'case_view') ||
            this.userHasPermissionSync(roleId, 'case_management') ||
            this.userHasPermissionSync(roleId, 'all_modules');
  }

  canEditCases(roleId: string): boolean {
    return this.userHasPermissionSync(roleId, 'case_management') ||
            this.userHasPermissionSync(roleId, 'all_modules');
  }

  // Initialize cache from backend
  loadCache(): Observable<void> {
    return new Observable(observer => {
      Promise.all([
        this.getAllRoles().toPromise(),
        this.getAllPermissions().toPromise()
      ]).then(() => {
        observer.next();
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }
}
