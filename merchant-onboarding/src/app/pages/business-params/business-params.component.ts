import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-business-params',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './business-params.component.html',
  styleUrl: './business-params.component.css'
})
export class BusinessParamsComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasPermission('system_configuration')) {
      this.notificationService.show('You do not have permission to access Business Parameters', 'error');
      setTimeout(() => this.router.navigate(['/dashboard']), 2000);
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
