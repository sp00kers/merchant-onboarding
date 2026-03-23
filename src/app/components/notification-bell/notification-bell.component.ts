import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Notification } from '../../models/notification.model';
import { InAppNotificationService } from '../../services/in-app-notification.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: Notification[] = [];
  isOpen = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: InAppNotificationService,
    private webSocketService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Subscribe to notifications
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );

    // Initial data load
    this.notificationService.refreshNotifications();

    // Connect WebSocket (will fallback to polling if unavailable)
    this.webSocketService.connect();

    // Start polling as fallback
    this.notificationService.startPolling(30000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notificationService.refreshNotifications();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  navigateToEntity(notification: Notification): void {
    this.markAsRead(notification, new Event('click'));
    this.closeDropdown();

    if (notification.relatedEntityType === 'Case' && notification.relatedEntityId) {
      this.router.navigate(['/cases', notification.relatedEntityId]);
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'SUCCESS': return '✓';
      case 'WARNING': return '⚠';
      case 'ERROR': return '✕';
      default: return 'ℹ';
    }
  }
}
