import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Analytics, STATUS_COLORS, TrendData } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';
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

  // Analytics data
  analytics: Analytics | null = null;
  isLoadingAnalytics = false;
  statusColors = STATUS_COLORS;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
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

    // Load analytics
    this.loadAnalytics();
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
    return Math.max(
      ...trends.map(t => t.totalCases),
      ...trends.map(t => t.approvedCases),
      ...trends.map(t => t.rejectedCases),
      ...trends.map(t => t.pendingCases),
      1
    );
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
