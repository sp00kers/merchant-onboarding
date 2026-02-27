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

  get showCases(): boolean {
    return this.authService.hasAnyPermission(['case_view', 'case_management', 'case_creation', 'all_modules']);
  }

  get showBusinessParams(): boolean {
    return this.authService.hasAnyPermission(['system_configuration', 'all_modules']);
  }

  get showAccountManagement(): boolean {
    return this.authService.hasAnyPermission(['user_management', 'role_management', 'permission_management', 'all_modules']);
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
