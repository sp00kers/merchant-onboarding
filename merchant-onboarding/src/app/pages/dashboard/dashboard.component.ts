import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  roleName = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.roleName = this.authService.getCurrentRoleName();

    // Show error if redirected due to insufficient permissions
    this.route.queryParams.subscribe(params => {
      if (params['unauthorized'] === 'true') {
        this.notificationService.error('Access denied. You do not have permission to access that page.');
      }
    });
  }
}
