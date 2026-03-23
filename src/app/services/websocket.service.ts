import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';
import { InAppNotificationService } from './in-app-notification.service';

declare var SockJS: any;
declare var Stomp: any;

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private stompClient: any;
  private connected = new BehaviorSubject<boolean>(false);
  public connected$ = this.connected.asObservable();

  private messageSubject = new Subject<Notification>();
  public messages$ = this.messageSubject.asObservable();

  constructor(
    private authService: AuthService,
    private notificationService: InAppNotificationService
  ) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    try {
      // Check if SockJS is available (loaded from CDN or npm)
      if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
        console.warn('SockJS/Stomp not available, using polling fallback');
        this.notificationService.startPolling(15000);
        return;
      }

      const socket = new SockJS('http://localhost:8080/ws');
      this.stompClient = Stomp.over(socket);

      // Disable debug logging
      this.stompClient.debug = null;

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      this.stompClient.connect(headers, () => {
        this.connected.next(true);
        console.log('WebSocket connected');

        // Subscribe to user-specific notification queue
        this.stompClient.subscribe('/user/queue/notifications', (message: any) => {
          try {
            const notification = JSON.parse(message.body) as Notification;
            this.messageSubject.next(notification);
            this.notificationService.addNotification(notification);
          } catch (e) {
            console.error('Failed to parse notification message', e);
          }
        });
      }, (error: any) => {
        console.error('WebSocket connection error:', error);
        this.connected.next(false);
        // Fallback to polling
        this.notificationService.startPolling(15000);
      });
    } catch (e) {
      console.warn('WebSocket initialization failed, using polling', e);
      this.notificationService.startPolling(15000);
    }
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        this.connected.next(false);
        console.log('WebSocket disconnected');
      });
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
