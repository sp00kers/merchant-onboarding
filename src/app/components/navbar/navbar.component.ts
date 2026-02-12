import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  get roleName(): string {
    return this.authService.getCurrentRoleName();
  }

  get showCases(): boolean {
    return this.authService.canViewCases();
  }

  get showBusinessParams(): boolean {
    return this.authService.hasPermission('system_configuration');
  }

  get showAccountManagement(): boolean {
    return this.authService.hasPermission('user_management') ||
           this.authService.hasPermission('role_management');
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
