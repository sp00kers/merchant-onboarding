import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Permission, Role } from '../../models/role.model';
import { NotificationService } from '../../services/notification.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.css']
})
export class PermissionManagementComponent implements OnInit {
  allPermissions: Permission[] = [];
  filteredPermissions: Permission[] = [];
  allRoles: Role[] = [];
  isLoading = false;

  // Filters
  searchTerm = '';
  categoryFilter = '';
  statusFilter = '';

  categoryOptions = [
    { value: 'case', label: 'Case Management' },
    { value: 'user', label: 'User Management' },
    { value: 'role', label: 'Role Management' },
    { value: 'system', label: 'System Configuration' },
    { value: 'report', label: 'Reports' }
  ];

  // Modal state
  showPermissionModal = false;
  showViewModal = false;
  modalTitle = 'Add Permission';
  currentEditingId: string | null = null;

  // Form fields
  permissionId = '';
  permissionName = '';
  permissionDescription = '';
  permissionCategory = '';
  permissionStatus = 'active';
  isIdDisabled = false;

  // Validation errors
  idError = '';
  nameError = '';
  descriptionError = '';
  categoryError = '';

  // Track whether user has interacted with each field
  idTouched = false;
  nameTouched = false;
  descriptionTouched = false;
  categoryTouched = false;

  // View modal
  viewPermission: Permission | null = null;

  constructor(
    private roleService: RoleService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      permissions: this.roleService.getAllPermissions(),
      roles: this.roleService.getAllRoles()
    }).subscribe({
      next: ({ permissions, roles }) => {
        this.allPermissions = permissions;
        this.allRoles = roles;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.error('Failed to load permissions data');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredPermissions = this.allPermissions.filter(perm => {
      const matchesSearch = !this.searchTerm ||
        perm.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = !this.categoryFilter || perm.category === this.categoryFilter;
      const matchesStatus = !this.statusFilter ||
        (this.statusFilter === 'active' && perm.isActive !== false) ||
        (this.statusFilter === 'inactive' && perm.isActive === false);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  getCategoryLabel(category?: string): string {
    const found = this.categoryOptions.find(c => c.value === category);
    return found ? found.label : 'Unknown';
  }

  getUsedInRolesCount(permissionId: string): number {
    return this.allRoles.filter(role => role.permissions.includes(permissionId)).length;
  }

  getUsedInRoles(permissionId: string): Role[] {
    return this.allRoles.filter(role => role.permissions.includes(permissionId));
  }

  // Create / Edit Modal
  showCreatePermissionModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add Permission';
    this.resetForm();
    this.isIdDisabled = false;
    this.showPermissionModal = true;
  }

  editPermission(permissionId: string): void {
    const perm = this.allPermissions.find(p => p.id === permissionId);
    if (!perm) return;
    this.currentEditingId = permissionId;
    this.modalTitle = 'Edit Permission';
    this.permissionId = perm.id;
    this.permissionName = perm.name;
    this.permissionDescription = perm.description;
    this.permissionCategory = perm.category || '';
    this.permissionStatus = perm.isActive !== false ? 'active' : 'inactive';
    this.isIdDisabled = true;
    this.showPermissionModal = true;
  }

  validateId(): void {
    if (!this.idTouched) return;
    this.idError = this.permissionId.trim() ? '' : 'Permission ID is required';
  }

  validateName(): void {
    if (!this.nameTouched) return;
    this.nameError = this.permissionName.trim() ? '' : 'Permission name is required';
  }

  validateDescription(): void {
    if (!this.descriptionTouched) return;
    this.descriptionError = this.permissionDescription.trim() ? '' : 'Description is required';
  }

  validateCategory(): void {
    if (!this.categoryTouched) return;
    this.categoryError = this.permissionCategory ? '' : 'Please select a category';
  }

  markAllTouched(): void {
    this.idTouched = true;
    this.nameTouched = true;
    this.descriptionTouched = true;
    this.categoryTouched = true;
  }

  get hasFormErrors(): boolean {
    return !this.permissionId.trim()
      || !this.permissionName.trim()
      || !this.permissionDescription.trim()
      || !this.permissionCategory
      || !!this.idError
      || !!this.nameError
      || !!this.descriptionError
      || !!this.categoryError;
  }

  savePermission(): void {
    this.markAllTouched();
    this.validateId();
    this.validateName();
    this.validateDescription();
    this.validateCategory();

    if (this.idError || this.nameError || this.descriptionError || this.categoryError) {
      this.notificationService.error('Please fix the errors before saving');
      return;
    }

    const permData: Partial<Permission> = {
      id: this.permissionId,
      name: this.permissionName,
      description: this.permissionDescription,
      category: this.permissionCategory,
      isActive: this.permissionStatus === 'active'
    };

    if (this.currentEditingId) {
      this.roleService.updatePermission(this.currentEditingId, permData).subscribe({
        next: () => {
          this.notificationService.success('Permission updated successfully!');
          this.closePermissionModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating permission:', error);
          this.notificationService.error('Failed to update permission');
        }
      });
    } else {
      if (this.allPermissions.find(p => p.id === this.permissionId)) {
        this.notificationService.error('Permission ID already exists');
        return;
      }
      this.roleService.addPermission(permData).subscribe({
        next: () => {
          this.notificationService.success('Permission created successfully!');
          this.closePermissionModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating permission:', error);
          this.notificationService.error('Failed to create permission');
        }
      });
    }
  }

  closePermissionModal(): void {
    this.showPermissionModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.permissionId = '';
    this.permissionName = '';
    this.permissionDescription = '';
    this.permissionCategory = '';
    this.permissionStatus = 'active';
    this.isIdDisabled = false;
    this.idError = '';
    this.nameError = '';
    this.descriptionError = '';
    this.categoryError = '';
    this.idTouched = false;
    this.nameTouched = false;
    this.descriptionTouched = false;
    this.categoryTouched = false;
  }

  // View modal
  openViewPermission(permissionId: string): void {
    this.viewPermission = this.allPermissions.find(p => p.id === permissionId) || null;
    if (this.viewPermission) {
      this.showViewModal = true;
    }
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewPermission = null;
  }

  getViewPermissionRoles(): Role[] {
    if (!this.viewPermission) return [];
    return this.getUsedInRoles(this.viewPermission.id);
  }

  // Actions
  togglePermissionStatus(permissionId: string): void {
    const perm = this.allPermissions.find(p => p.id === permissionId);
    if (!perm) return;
    const newStatus = perm.isActive === false;
    const action = newStatus ? 'activate' : 'deactivate';
    if (confirm(`Are you sure you want to ${action} the permission "${perm.name}"?`)) {
      this.roleService.updatePermission(permissionId, { isActive: newStatus }).subscribe({
        next: () => {
          this.notificationService.success(`Permission ${action}d successfully!`);
          this.loadData();
        },
        error: (error) => {
          console.error('Error toggling permission status:', error);
          this.notificationService.error(`Failed to ${action} permission`);
        }
      });
    }
  }

  deletePermission(permissionId: string): void {
    const perm = this.allPermissions.find(p => p.id === permissionId);
    if (!perm) return;
    const usedCount = this.getUsedInRolesCount(permissionId);
    let msg = `Are you sure you want to delete the permission "${perm.name}"? This action cannot be undone.`;
    if (usedCount > 0) {
      msg = `WARNING: This permission "${perm.name}" is currently used by ${usedCount} role(s). Deleting it will remove it from all roles. Are you sure you want to continue?`;
    }
    if (confirm(msg)) {
      this.roleService.deletePermission(permissionId).subscribe({
        next: () => {
          this.notificationService.success('Permission deleted successfully!');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting permission:', error);
          this.notificationService.error('Failed to delete permission');
        }
      });
    }
  }

}
