import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Analytics, RISK_LEVEL_COLORS, STATUS_COLORS, TrendData, UserPerformance } from '../../models/analytics.model';
import { Case } from '../../models/case.model';
import { AnalyticsService } from '../../services/analytics.service';
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

  // Analytics data
  analytics: Analytics | null = null;
  isLoadingAnalytics = false;
  riskLevelColors = RISK_LEVEL_COLORS;
  statusColors = STATUS_COLORS;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private caseService: CaseService,
    private analyticsService: AnalyticsService
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

    // Load analytics
    this.loadAnalytics();
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

  private loadAnalytics(): void {
    this.isLoadingAnalytics = true;
    this.analyticsService.getDashboardAnalytics().subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.isLoadingAnalytics = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.isLoadingAnalytics = false;
      }
    });
  }

  private calculateStats(cases: Case[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.pendingCount = cases.filter(c =>
      c.status === 'pending_review' || c.status === 'draft' || c.status === 'Pending Review'
    ).length;

    this.underReviewCount = cases.filter(c =>
      c.status === 'compliance_review' || c.status === 'background_verification' ||
      c.status === 'Compliance Review' || c.status === 'Background Verification'
    ).length;

    this.approvedTodayCount = cases.filter(c => {
      if (c.status !== 'approved' && c.status !== 'Approved') return false;
      const lastUpdated = new Date(c.lastUpdated);
      lastUpdated.setHours(0, 0, 0, 0);
      return lastUpdated.getTime() === today.getTime();
    }).length;

    this.rejectedCount = cases.filter(c => c.status === 'rejected' || c.status === 'Rejected').length;
  }

  // Helper methods for charts
  getRiskDistributionData(): { label: string; value: number; color: string }[] {
    if (!this.analytics?.riskDistribution) return [];
    return Object.entries(this.analytics.riskDistribution)
      .filter(([_, value]) => value > 0)
      .map(([label, value]) => ({
        label,
        value,
        color: this.riskLevelColors[label] || '#6c757d'
      }));
  }

  getStatusDistributionData(): { label: string; value: number; color: string }[] {
    if (!this.analytics?.statusDistribution) return [];
    return Object.entries(this.analytics.statusDistribution)
      .filter(([_, value]) => value > 0)
      .map(([label, value]) => ({
        label,
        value,
        color: this.statusColors[label] || '#6c757d'
      }));
  }

  getTotalFromDistribution(distribution: Record<string, number> | undefined): number {
    if (!distribution) return 0;
    return Object.values(distribution).reduce((sum, val) => sum + val, 0);
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  getRecentTrends(): TrendData[] {
    if (!this.analytics?.caseTrends) return [];
    return this.analytics.caseTrends.slice(-7); // Last 7 days
  }

  getMaxTrendValue(): number {
    const trends = this.getRecentTrends();
    if (trends.length === 0) return 0;
    return Math.max(...trends.map(t => t.totalCases), 1);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getTopPerformers(): UserPerformance[] {
    return this.analytics?.topReviewers || [];
  }
}
