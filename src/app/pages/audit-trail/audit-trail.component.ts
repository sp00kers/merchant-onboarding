import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuditLog, AuditLogPage, AuditStats } from '../../models/audit.model';
import { AuditService } from '../../services/audit.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.css'
})
export class AuditTrailComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  stats: AuditStats | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Filters
  availableActions: string[] = [];
  availableEntityTypes: string[] = [];

  filters = {
    entityType: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: ''
  };

  loading = false;
  selectedLog: AuditLog | null = null;

  constructor(
    private auditService: AuditService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
    this.loadFilterOptions();
    this.loadStats();
  }

  loadAuditLogs(): void {
    this.loading = true;
    const activeFilters: any = {};

    if (this.filters.entityType) activeFilters.entityType = this.filters.entityType;
    if (this.filters.action) activeFilters.action = this.filters.action;
    if (this.filters.userId) activeFilters.userId = this.filters.userId;
    if (this.filters.startDate) activeFilters.startDate = this.filters.startDate + 'T00:00:00';
    if (this.filters.endDate) activeFilters.endDate = this.filters.endDate + 'T23:59:59';

    this.auditService.getAuditLogs(this.currentPage, this.pageSize, activeFilters).subscribe({
      next: (page: AuditLogPage) => {
        this.auditLogs = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load audit logs');
        this.loading = false;
        console.error('Error loading audit logs:', error);
      }
    });
  }

  loadFilterOptions(): void {
    this.auditService.getDistinctActions().subscribe({
      next: (actions) => this.availableActions = actions,
      error: () => console.error('Failed to load actions')
    });

    this.auditService.getDistinctEntityTypes().subscribe({
      next: (types) => this.availableEntityTypes = types,
      error: () => console.error('Failed to load entity types')
    });
  }

  loadStats(): void {
    this.auditService.getAuditStats().subscribe({
      next: (stats) => this.stats = stats,
      error: () => console.error('Failed to load stats')
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadAuditLogs();
  }

  clearFilters(): void {
    this.filters = {
      entityType: '',
      action: '',
      userId: '',
      startDate: '',
      endDate: ''
    };
    this.currentPage = 0;
    this.loadAuditLogs();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAuditLogs();
    }
  }

  viewDetails(log: AuditLog): void {
    this.selectedLog = log;
  }

  closeDetails(): void {
    this.selectedLog = null;
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SUCCESS': return 'status-success';
      case 'FAILURE': return 'status-failure';
      default: return 'status-default';
    }
  }

  getActionClass(action: string): string {
    if (action?.includes('DELETE')) return 'action-delete';
    if (action?.includes('CREATE')) return 'action-create';
    if (action?.includes('UPDATE') || action?.includes('ASSIGN')) return 'action-update';
    if (action?.includes('LOGIN')) return 'action-login';
    return 'action-default';
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  formatJson(jsonString: string): string {
    if (!jsonString) return '-';
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonString;
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 5);
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
