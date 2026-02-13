import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Role } from '../../models/role.model';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  roles: Role[] = [];
  selectedRole = '';
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private roleService: RoleService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If already logged in, redirect to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    // Load roles from backend
    this.roleService.getActiveRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.errorMessage = 'Failed to load roles. Please try again.';
      }
    });
  }

  login(): void {
    if (this.selectedRole) {
      // For now, use role-based login (legacy mode)
      // TODO: Implement full authentication with email/password
      this.authService.loginWithRole(this.selectedRole);
    } else {
      this.errorMessage = 'Please select a role';
    }
  }
}
