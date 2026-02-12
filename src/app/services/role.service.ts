import { Injectable } from '@angular/core';
import { Permission, Role } from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly ROLES_KEY = 'roles';
  private readonly PERMISSIONS_KEY = 'permissions';

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    if (!localStorage.getItem(this.ROLES_KEY)) {
      const defaultRoles: Role[] = [
        {
          id: 'admin',
          name: 'System Administrator',
          description: 'Full system access and user management',
          permissions: ['all_modules', 'user_management', 'system_configuration', 'role_management', 'permission_management'],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'onboarding_officer',
          name: 'Onboarding Officer',
          description: 'Create new merchant onboarding cases and view existing ones',
          permissions: ['case_creation', 'case_view', 'document_upload'],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'compliance_reviewer',
          name: 'Compliance Reviewer',
          description: 'Review and edit cases for regulatory compliance',
          permissions: ['case_view', 'case_management', 'compliance_check', 'risk_assessment', 'document_upload'],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'verifier',
          name: 'Background Verifier',
          description: 'Conduct background verification processes',
          permissions: ['case_view', 'background_check', 'external_api_access', 'verification_reports'],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(defaultRoles));
    }

    if (!localStorage.getItem(this.PERMISSIONS_KEY)) {
      const defaultPermissions: Permission[] = [
        { id: 'all_modules', name: 'All Modules', description: 'Access to all system modules', category: 'system', isActive: true, createdAt: new Date().toISOString() },
        { id: 'user_management', name: 'User Management', description: 'Manage system users', category: 'user', isActive: true, createdAt: new Date().toISOString() },
        { id: 'system_configuration', name: 'System Configuration', description: 'Configure system settings', category: 'system', isActive: true, createdAt: new Date().toISOString() },
        { id: 'role_management', name: 'Role Management', description: 'Manage roles and permissions', category: 'role', isActive: true, createdAt: new Date().toISOString() },
        { id: 'permission_management', name: 'Permission Management', description: 'Manage system permissions', category: 'role', isActive: true, createdAt: new Date().toISOString() },
        { id: 'case_creation', name: 'Case Creation', description: 'Create new cases', category: 'case', isActive: true, createdAt: new Date().toISOString() },
        { id: 'case_view', name: 'Case View', description: 'View cases in read-only mode', category: 'case', isActive: true, createdAt: new Date().toISOString() },
        { id: 'case_management', name: 'Case Management', description: 'Edit and manage existing cases', category: 'case', isActive: true, createdAt: new Date().toISOString() },
        { id: 'document_upload', name: 'Document Upload', description: 'Upload case documents', category: 'case', isActive: true, createdAt: new Date().toISOString() },
        { id: 'compliance_check', name: 'Compliance Check', description: 'Perform compliance checks', category: 'case', isActive: true, createdAt: new Date().toISOString() },
        { id: 'risk_assessment', name: 'Risk Assessment', description: 'Conduct risk assessments', category: 'case', isActive: true, createdAt: new Date().toISOString() },
        { id: 'background_check', name: 'Background Check', description: 'Perform background verifications', category: 'case', isActive: true, createdAt: new Date().toISOString() },
        { id: 'external_api_access', name: 'External API Access', description: 'Access external APIs', category: 'system', isActive: true, createdAt: new Date().toISOString() },
        { id: 'verification_reports', name: 'Verification Reports', description: 'Generate verification reports', category: 'report', isActive: true, createdAt: new Date().toISOString() }
      ];
      localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(defaultPermissions));
    }

    this.fixExistingRoles();
  }

  private fixExistingRoles(): void {
    const roles = this.getAllRoles();
    let updated = false;

    roles.forEach(role => {
      if (role.id === 'compliance_reviewer') {
        if (role.permissions.includes('case_review') && !role.permissions.includes('case_view')) {
          role.permissions = role.permissions.filter(p => p !== 'case_review');
          if (!role.permissions.includes('case_view')) role.permissions.push('case_view');
          if (!role.permissions.includes('case_management')) role.permissions.push('case_management');
          if (!role.permissions.includes('document_upload')) role.permissions.push('document_upload');
          updated = true;
        }
      }
    });

    if (updated) {
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
    }
  }

  getAllRoles(): Role[] {
    return JSON.parse(localStorage.getItem(this.ROLES_KEY) || '[]');
  }

  getActiveRoles(): Role[] {
    return this.getAllRoles().filter(role => role.isActive);
  }

  getRoleById(roleId: string): Role | undefined {
    return this.getAllRoles().find(role => role.id === roleId);
  }

  createRole(roleData: Partial<Role>): Role {
    const roles = this.getAllRoles();
    const newRole: Role = {
      id: 'role_' + Date.now(),
      name: roleData.name || '',
      description: roleData.description || '',
      permissions: roleData.permissions || [],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    roles.push(newRole);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
    return newRole;
  }

  updateRole(roleId: string, updates: Partial<Role>): Role | null {
    const roles = this.getAllRoles();
    const roleIndex = roles.findIndex(role => role.id === roleId);
    if (roleIndex !== -1) {
      roles[roleIndex] = { ...roles[roleIndex], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
      return roles[roleIndex];
    }
    return null;
  }

  deleteRole(roleId: string): void {
    const roles = this.getAllRoles().filter(role => role.id !== roleId);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
  }

  getAllPermissions(): Permission[] {
    return JSON.parse(localStorage.getItem(this.PERMISSIONS_KEY) || '[]');
  }

  userHasPermission(userRole: string, requiredPermission: string): boolean {
    const role = this.getRoleById(userRole);
    if (!role) return false;
    if (role.permissions.includes('all_modules')) return true;
    return role.permissions.includes(requiredPermission);
  }

  canViewCases(userRole: string): boolean {
    return this.userHasPermission(userRole, 'case_view') ||
           this.userHasPermission(userRole, 'case_management') ||
           this.userHasPermission(userRole, 'all_modules');
  }

  canEditCases(userRole: string): boolean {
    return this.userHasPermission(userRole, 'case_management') ||
           this.userHasPermission(userRole, 'all_modules');
  }

  addPermission(permissionData: Partial<Permission>): Permission {
    const permissions = this.getAllPermissions();
    const newPermission: Permission = {
      id: permissionData.id || 'perm_' + Date.now(),
      name: permissionData.name || '',
      description: permissionData.description || '',
      category: permissionData.category,
      isActive: permissionData.isActive !== false,
      createdAt: new Date().toISOString()
    };
    permissions.push(newPermission);
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
    return newPermission;
  }

  updatePermission(permissionId: string, updates: Partial<Permission>): Permission | null {
    const permissions = this.getAllPermissions();
    const index = permissions.findIndex(p => p.id === permissionId);
    if (index !== -1) {
      permissions[index] = { ...permissions[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
      return permissions[index];
    }
    return null;
  }

  deletePermission(permissionId: string): void {
    const permissions = this.getAllPermissions().filter(p => p.id !== permissionId);
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
    // Also remove from all roles
    const roles = this.getAllRoles();
    let rolesUpdated = false;
    roles.forEach(role => {
      if (role.permissions.includes(permissionId)) {
        role.permissions = role.permissions.filter(p => p !== permissionId);
        rolesUpdated = true;
      }
    });
    if (rolesUpdated) {
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
    }
  }

  getPermissionById(permissionId: string): Permission | undefined {
    return this.getAllPermissions().find(p => p.id === permissionId);
  }
}
