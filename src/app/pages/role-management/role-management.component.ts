import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Permission, Role } from '../../models/role.model';
import { NotificationService } from '../../services/notification.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css']
})
export class RoleManagementComponent implements OnInit {
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  allPermissions: Permission[] = [];

  // Filters
  searchTerm = '';
  statusFilter = '';

  // Modal state
  showRoleModal = false;
  showViewModal = false;
  modalTitle = 'Add Role';
  currentEditingId: string | null = null;

  // Form fields
  roleName = '';
  roleDescription = '';
  roleStatus = 'active';
  permissionSearch = '';
  selectedPermissions: { [key: string]: boolean } = {};

  // View modal
  viewRole: Role | null = null;

  constructor(
    private roleService: RoleService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.allRoles = this.roleService.getAllRoles();
    this.allPermissions = this.roleService.getAllPermissions();
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredRoles = this.allRoles.filter(role => {
      const matchesSearch = !this.searchTerm ||
        role.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.statusFilter ||
        (this.statusFilter === 'active' && role.isActive) ||
        (this.statusFilter === 'inactive' && !role.isActive);
      return matchesSearch && matchesStatus;
    });
  }

  getPermissionNames(role: Role): string[] {
    return role.permissions.slice(0, 2).map(permId => {
      const perm = this.allPermissions.find(p => p.id === permId);
      return perm ? perm.name : permId;
    });
  }

  getRemainingCount(role: Role): number {
    return Math.max(0, role.permissions.length - 2);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Create / Edit Modal
  showCreateRoleModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add Role';
    this.resetForm();
    this.showRoleModal = true;
  }

  editRole(roleId: string): void {
    const role = this.roleService.getRoleById(roleId);
    if (!role) return;
    this.currentEditingId = roleId;
    this.modalTitle = 'Edit Role';
    this.roleName = role.name;
    this.roleDescription = role.description;
    this.roleStatus = role.isActive ? 'active' : 'inactive';

    this.selectedPermissions = {};
    this.allPermissions.forEach(p => {
      this.selectedPermissions[p.id] = role.permissions.includes(p.id);
    });

    this.showRoleModal = true;
  }

  saveRole(): void {
    if (!this.roleName.trim()) {
      this.notificationService.error('Please enter a role name');
      return;
    }

    const permissionsList = Object.keys(this.selectedPermissions).filter(k => this.selectedPermissions[k]);

    const roleData: Partial<Role> = {
      name: this.roleName,
      description: this.roleDescription,
      permissions: permissionsList,
      isActive: this.roleStatus === 'active'
    };

    if (this.currentEditingId) {
      this.roleService.updateRole(this.currentEditingId, roleData);
      this.notificationService.success('Role updated successfully!');
    } else {
      this.roleService.createRole(roleData);
      this.notificationService.success('Role created successfully!');
    }

    this.closeRoleModal();
    this.loadData();
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.roleName = '';
    this.roleDescription = '';
    this.roleStatus = 'active';
    this.permissionSearch = '';
    this.selectedPermissions = {};
  }

  // View modal
  openViewRole(roleId: string): void {
    this.viewRole = this.roleService.getRoleById(roleId) || null;
    if (this.viewRole) {
      this.showViewModal = true;
    }
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewRole = null;
  }

  editFromView(): void {
    if (this.viewRole) {
      this.closeViewModal();
      this.editRole(this.viewRole.id);
    }
  }

  getViewRolePermissions(): Permission[] {
    if (!this.viewRole) return [];
    return this.viewRole.permissions
      .map(permId => this.allPermissions.find(p => p.id === permId))
      .filter((p): p is Permission => !!p);
  }

  // Filtered permissions for modal
  getFilteredPermissions(): Permission[] {
    if (!this.permissionSearch) return this.allPermissions;
    const term = this.permissionSearch.toLowerCase();
    return this.allPermissions.filter(p =>
      p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
    );
  }

  // Actions
  toggleRoleStatus(roleId: string): void {
    const role = this.roleService.getRoleById(roleId);
    if (!role) return;
    const newStatus = !role.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    if (confirm(`Are you sure you want to ${action} the role "${role.name}"?`)) {
      this.roleService.updateRole(roleId, { isActive: newStatus });
      this.notificationService.success(`Role ${action}d successfully!`);
      this.loadData();
    }
  }

  deleteRole(roleId: string): void {
    const role = this.roleService.getRoleById(roleId);
    if (!role) return;
    const isSystemRole = ['admin', 'onboarding_officer', 'compliance_reviewer', 'verifier'].includes(roleId);
    let msg = `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`;
    if (isSystemRole) {
      msg = `WARNING: You are about to delete a system role "${role.name}". This may affect system functionality. Are you sure?`;
    }
    if (confirm(msg)) {
      this.roleService.deleteRole(roleId);
      this.notificationService.success('Role deleted successfully!');
      this.loadData();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.showRoleModal = false;
      this.showViewModal = false;
    }
  }
}
