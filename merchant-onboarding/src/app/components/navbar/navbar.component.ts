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
    const roleId = this.authService.getCurrentRoleId();
    return roleId === 'admin';
  }

  get showAccountManagement(): boolean {
    const roleId = this.authService.getCurrentRoleId();
    return roleId === 'admin';
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
