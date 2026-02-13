import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Permission, Role, User } from '../../models/role.model';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];
  allPermissions: Permission[] = [];
  isLoading = false;

  // Filters
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  departmentFilter = '';

  departments = ['Merchant Services', 'Compliance', 'Risk Management', 'IT', 'Operations'];

  // Modal state
  showUserModal = false;
  showViewModal = false;
  showPermissionsModal = false;
  modalTitle = 'Add User';
  currentEditingId: string | null = null;
  activeTab = 'details';

  // Form fields
  userName = '';
  userEmail = '';
  userRole = '';
  userDepartment = '';
  userPhone = '';
  userStatus = 'active';
  userNotes = '';

  // Permissions tab
  permissionSearch = '';
  customPermissions: { [key: string]: boolean } = {};

  // View modal
  viewUser: User | null = null;
  viewUserRole: Role | undefined;

  // Permissions modal
  permissionsUser: User | null = null;
  permissionsUserRole: Role | undefined;

  constructor(
    private accountService: AccountService,
    private roleService: RoleService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      users: this.accountService.getAllUsers(),
      roles: this.roleService.getActiveRoles(),
      permissions: this.roleService.getAllPermissions()
    }).subscribe({
      next: ({ users, roles, permissions }) => {
        this.allUsers = users;
        this.roles = roles;
        this.allPermissions = permissions;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.error('Failed to load user data');
        this.isLoading = false;
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.getCurrentRoleId() === 'admin';
  }

  getRoleName(roleId: string): string {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  }

  applyFilters(): void {
    this.filteredUsers = this.allUsers.filter(user => {
      const matchesSearch = !this.searchTerm ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = !this.roleFilter || user.roleId === this.roleFilter;
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      const matchesDept = !this.departmentFilter || user.department === this.departmentFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });
  }

  // Create / Edit Modal
  showCreateUserModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add User';
    this.resetForm();
    this.activeTab = 'details';
    this.showUserModal = true;
  }

  editUser(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (!user) return;
    this.currentEditingId = userId;
    this.modalTitle = 'Edit User';
    this.userName = user.name;
    this.userEmail = user.email;
    this.userRole = user.roleId;
    this.userDepartment = user.department;
    this.userPhone = user.phone || '';
    this.userStatus = user.status;
    this.userNotes = user.notes || '';
    this.activeTab = 'details';

    // Load custom permissions
    this.customPermissions = {};
    this.allPermissions.forEach(p => {
      this.customPermissions[p.id] = (user.customPermissions || []).includes(p.id);
    });

    this.showUserModal = true;
  }

  saveUser(): void {
    if (!this.userName.trim() || !this.userEmail.trim() || !this.userRole || !this.userDepartment) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const userData: Partial<User> = {
      name: this.userName,
      email: this.userEmail,
      roleId: this.userRole,
      department: this.userDepartment,
      phone: this.userPhone,
      status: this.userStatus,
      notes: this.userNotes
    };

    if (this.isAdmin && this.currentEditingId) {
      userData.customPermissions = Object.keys(this.customPermissions).filter(k => this.customPermissions[k]);
    }

    if (this.currentEditingId) {
      this.accountService.updateUser(this.currentEditingId, userData).subscribe({
        next: () => {
          this.notificationService.success('User updated successfully!');
          this.closeUserModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.notificationService.error('Failed to update user');
        }
      });
    } else {
      this.accountService.createUser(userData).subscribe({
        next: () => {
          this.notificationService.success('User created successfully!');
          this.closeUserModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.notificationService.error('Failed to create user');
        }
      });
    }
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.userName = '';
    this.userEmail = '';
    this.userRole = '';
    this.userDepartment = '';
    this.userPhone = '';
    this.userStatus = 'active';
    this.userNotes = '';
    this.customPermissions = {};
    this.permissionSearch = '';
  }

  // View modal
  openViewUser(userId: string): void {
    this.viewUser = this.allUsers.find(u => u.id === userId) || null;
    if (this.viewUser) {
      this.viewUserRole = this.roles.find(r => r.id === this.viewUser?.roleId);
      this.showViewModal = true;
    }
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewUser = null;
  }

  editFromView(): void {
    if (this.viewUser) {
      this.closeViewModal();
      this.editUser(this.viewUser.id);
    }
  }

  getViewUserPermissions(): Permission[] {
    if (!this.viewUserRole) return [];
    return this.viewUserRole.permissions
      .map(permId => this.allPermissions.find(p => p.id === permId))
      .filter((p): p is Permission => !!p);
  }

  // Permissions modal
  openPermissionsModal(userId: string): void {
    this.permissionsUser = this.allUsers.find(u => u.id === userId) || null;
    if (this.permissionsUser) {
      this.permissionsUserRole = this.roles.find(r => r.id === this.permissionsUser?.roleId);
      this.showPermissionsModal = true;
    }
  }

  closePermissionsModal(): void {
    this.showPermissionsModal = false;
    this.permissionsUser = null;
  }

  getPermissionsForUser(): Permission[] {
    if (!this.permissionsUserRole) return [];
    return this.permissionsUserRole.permissions
      .map(permId => this.allPermissions.find(p => p.id === permId))
      .filter((p): p is Permission => !!p);
  }

  // Filtered permissions for custom permissions tab
  getFilteredPermissions(): Permission[] {
    if (!this.permissionSearch) return this.allPermissions;
    const term = this.permissionSearch.toLowerCase();
    return this.allPermissions.filter(p =>
      p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
    );
  }

  // Actions
  toggleUserStatus(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (!user) return;
    const action = user.status === 'active' ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} user ${user.name}?`)) {
      this.accountService.toggleUserStatus(userId).subscribe({
        next: () => {
          this.notificationService.success(`User ${action}d successfully!`);
          this.loadData();
        },
        error: (error) => {
          console.error('Error toggling user status:', error);
          this.notificationService.error(`Failed to ${action} user`);
        }
      });
    }
  }

  deleteUser(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (!user) return;
    if (confirm(`Are you sure you want to delete user ${user.name}? This action cannot be undone.`)) {
      this.accountService.deleteUser(userId).subscribe({
        next: () => {
          this.notificationService.success('User deleted successfully!');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.notificationService.error('Failed to delete user');
        }
      });
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.showUserModal = false;
      this.showViewModal = false;
      this.showPermissionsModal = false;
    }
  }
}
