import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Case } from '../../models/case.model';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
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

  // Case status counts
  pendingCount = 0;
  underReviewCount = 0;
  approvedTodayCount = 0;
  rejectedCount = 0;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private caseService: CaseService
  ) {}

  ngOnInit(): void {
    this.roleName = this.authService.getCurrentRoleName();

    // Show error if redirected due to insufficient permissions
    this.route.queryParams.subscribe(params => {
      if (params['unauthorized'] === 'true') {
        this.notificationService.error('Access denied. You do not have permission to access that page.');
      }
    });

    // Load case statistics
    this.loadCaseStats();
  }

  private loadCaseStats(): void {
    this.caseService.getAllCases().subscribe({
      next: (cases: Case[]) => {
        this.calculateStats(cases);
      },
      error: (error) => {
        console.error('Error loading case statistics:', error);
      }
    });
  }

  private calculateStats(cases: Case[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.pendingCount = cases.filter(c =>
      c.status === 'pending_review' || c.status === 'draft'
    ).length;

    this.underReviewCount = cases.filter(c =>
      c.status === 'compliance_review' || c.status === 'background_verification'
    ).length;

    this.approvedTodayCount = cases.filter(c => {
      if (c.status !== 'approved') return false;
      const lastUpdated = new Date(c.lastUpdated);
      lastUpdated.setHours(0, 0, 0, 0);
      return lastUpdated.getTime() === today.getTime();
    }).length;

    this.rejectedCount = cases.filter(c => c.status === 'rejected').length;
  }
}
