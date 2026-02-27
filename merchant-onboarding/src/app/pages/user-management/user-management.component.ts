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
  emailError = '';
  nameError = '';
  roleError = '';
  departmentError = '';
  phoneError = '';
  passwordError = '';
  confirmPasswordError = '';
  emailPattern = '^[a-zA-Z0-9._%+-]+@bank\\.com$';
  userRole = '';
  userDepartment = '';
  userPhone = '';
  userPassword = '';
  userConfirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  userStatus = 'active';
  userNotes = '';

  // Track whether user has interacted with each field
  nameTouched = false;
  emailTouched = false;
  roleTouched = false;
  departmentTouched = false;
  phoneTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;

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
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = !this.roleFilter || user.roleId === this.roleFilter;
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      const matchesDept = !this.departmentFilter || user.department === this.departmentFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.departmentFilter = '';
    this.applyFilters();
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

  validateEmail(): void {
    if (!this.emailTouched) return;
    const email = this.userEmail.trim();
    if (!email) {
      this.emailError = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      this.emailError = 'Please enter a valid email address';
    } else if (!/^[a-zA-Z0-9._%+-]+@bank\.com$/i.test(email)) {
      this.emailError = 'Email must use @bank.com domain';
    } else {
      this.emailError = '';
    }
  }

  validateName(): void {
    if (!this.nameTouched) return;
    this.nameError = this.userName.trim() ? '' : 'Full name is required';
  }

  validateRole(): void {
    if (!this.roleTouched) return;
    this.roleError = this.userRole ? '' : 'Please select a role';
  }

  validateDepartment(): void {
    if (!this.departmentTouched) return;
    this.departmentError = this.userDepartment ? '' : 'Please select a department';
  }

  validatePhone(): void {
    if (!this.phoneTouched) return;
    const phone = this.userPhone.trim();
    if (!phone) {
      this.phoneError = 'Phone number is required';
    } else if (!/^\+?[0-9]+$/.test(phone)) {
      this.phoneError = 'Phone number must contain only numbers';
    } else {
      this.phoneError = '';
    }
  }

  validatePassword(): void {
    if (!this.passwordTouched) return;
    const password = this.userPassword;
    if (!password) {
      this.passwordError = 'This field is required.';
    } else if (password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
    } else {
      this.passwordError = '';
    }
    // Re-validate confirm password if it was touched
    if (this.confirmPasswordTouched) {
      this.validateConfirmPassword();
    }
  }

  validateConfirmPassword(): void {
    if (!this.confirmPasswordTouched) return;
    if (!this.userConfirmPassword) {
      this.confirmPasswordError = 'This field is required.';
    } else if (this.userConfirmPassword !== this.userPassword) {
      this.confirmPasswordError = 'Passwords do not match';
    } else {
      this.confirmPasswordError = '';
    }
  }

  markAllTouched(): void {
    this.nameTouched = true;
    this.emailTouched = true;
    this.roleTouched = true;
    this.departmentTouched = true;
    this.phoneTouched = true;
    if (!this.currentEditingId) {
      this.passwordTouched = true;
      this.confirmPasswordTouched = true;
    }
  }

  get hasFormErrors(): boolean {
    const baseErrors = !this.userName.trim()
      || !this.userEmail.trim()
      || !this.userRole
      || !this.userDepartment
      || !this.userPhone.trim()
      || !!this.nameError
      || !!this.emailError
      || !!this.roleError
      || !!this.departmentError
      || !!this.phoneError;

    // Password fields are only required when creating a new user
    if (!this.currentEditingId) {
      return baseErrors
        || !this.userPassword
        || !this.userConfirmPassword
        || !!this.passwordError
        || !!this.confirmPasswordError;
    }

    return baseErrors;
  }

  saveUser(): void {
    // Mark all fields as touched so errors display
    this.markAllTouched();

    // Validate all fields
    this.validateName();
    this.validateEmail();
    this.validateRole();
    this.validateDepartment();
    this.validatePhone();
    if (!this.currentEditingId) {
      this.validatePassword();
      this.validateConfirmPassword();
    }

    if (this.nameError || this.emailError || this.roleError || this.departmentError || this.phoneError
        || (!this.currentEditingId && (this.passwordError || this.confirmPasswordError))) {
      this.notificationService.error('Please fix the errors before saving');
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

    // Include password only when creating a new user
    if (!this.currentEditingId) {
      userData.password = this.userPassword;
    }

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
          const errorMsg = error.error?.message || error.error?.errors?.email || 'Failed to update user';
          this.notificationService.error(errorMsg);
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
          const errorMsg = error.error?.message || error.error?.errors?.email || 'Failed to create user';
          this.notificationService.error(errorMsg);
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
    this.emailError = '';
    this.nameError = '';
    this.roleError = '';
    this.departmentError = '';
    this.phoneError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.nameTouched = false;
    this.emailTouched = false;
    this.roleTouched = false;
    this.departmentTouched = false;
    this.phoneTouched = false;
    this.passwordTouched = false;
    this.confirmPasswordTouched = false;
    this.userRole = '';
    this.userDepartment = '';
    this.userPhone = '';
    this.userPassword = '';
    this.userConfirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
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
          const errorMsg = error.error?.message || `Failed to ${action} user`;
          this.notificationService.error(errorMsg);
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

}
