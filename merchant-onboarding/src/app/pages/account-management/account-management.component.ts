import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
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
    const users = this.accountService.getAllUsers();
    this.totalUsers = users.length;
    this.activeUsers = users.filter(u => u.status === 'active').length;
    this.totalRoles = this.roleService.getAllRoles().length;
    this.totalPermissions = this.roleService.getAllPermissions().length;
  }

  navigateTo(path: string): void {
    const roleId = this.authService.getCurrentRole()?.id || '';
    if (path.includes('user-management') && !this.roleService.userHasPermission(roleId, 'user_management')) {
      this.notificationService.error('You do not have permission to access User Management');
      return;
    }
    if (path.includes('role-management') && !this.roleService.userHasPermission(roleId, 'role_management')) {
      this.notificationService.error('You do not have permission to access Role Management');
      return;
    }
    if (path.includes('permission-management') && !this.roleService.userHasPermission(roleId, 'permission_management')) {
      this.notificationService.error('You do not have permission to access Permission Management');
      return;
    }
    this.router.navigate([path]);
  }
}
