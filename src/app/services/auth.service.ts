import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '../models/role.model';
import { RoleService } from './role.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_ROLE_KEY = 'userRole';

  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}

  login(roleId: string): void {
    localStorage.setItem(this.USER_ROLE_KEY, roleId);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(this.USER_ROLE_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.USER_ROLE_KEY);
  }

  getCurrentRoleId(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  getCurrentRole(): Role | undefined {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return undefined;
    return this.roleService.getRoleById(roleId);
  }

  getCurrentRoleName(): string {
    const role = this.getCurrentRole();
    return role ? role.name : 'Unknown Role';
  }

  hasPermission(permission: string): boolean {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return false;
    return this.roleService.userHasPermission(roleId, permission);
  }

  canViewCases(): boolean {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return false;
    return this.roleService.canViewCases(roleId);
  }

  canEditCases(): boolean {
    const roleId = this.getCurrentRoleId();
    if (!roleId) return false;
    return this.roleService.canEditCases(roleId);
  }
}
