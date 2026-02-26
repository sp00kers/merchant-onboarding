import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './account-management.component.html',
  styleUrls: ['./account-management.component.css']
})
export class AccountManagementComponent implements OnInit {
  totalUsers = 0;
  activeUsers = 0;
  totalRoles = 0;
  totalPermissions = 0;

  constructor(
    private router: Router,
    private accountService: AccountService,
    private roleService: RoleService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    forkJoin({
      users: this.accountService.getAllUsers(),
      roles: this.roleService.getAllRoles(),
      permissions: this.roleService.getAllPermissions()
    }).subscribe({
      next: ({ users, roles, permissions }) => {
        this.totalUsers = users.length;
        this.activeUsers = users.filter(u => u.status === 'active').length;
        this.totalRoles = roles.length;
        this.totalPermissions = permissions.length;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  navigateTo(path: string): void {
    // Check specific permission for the target page
    const permissionMap: { [key: string]: string[] } = {
      '/account-management/user-management': ['user_management', 'all_modules'],
      '/account-management/role-management': ['role_management', 'all_modules'],
      '/account-management/permission-management': ['permission_management', 'all_modules']
    };

    const requiredPermissions = permissionMap[path] || ['all_modules'];
    if (!this.authService.hasAnyPermission(requiredPermissions)) {
      this.notificationService.error('You do not have permission to access this page');
      return;
    }
    this.router.navigate([path]);
  }
}
