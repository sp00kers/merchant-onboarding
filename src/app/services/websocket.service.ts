import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';
import { InAppNotificationService } from './in-app-notification.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private connected = new BehaviorSubject<boolean>(false);
  public connected$ = this.connected.asObservable();

  private messageSubject = new Subject<Notification>();
  public messages$ = this.messageSubject.asObservable();

  constructor(
    private authService: AuthService,
    private notificationService: InAppNotificationService,
    private ngZone: NgZone
  ) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    // Disconnect any existing connection first
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }

    // Convert http(s) API URL to ws(s) WebSocket URL
    const wsUrl = environment.apiUrl
      .replace('/api', '/ws')
      .replace(/^http/, 'ws');

    this.stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {},  // Disable debug logging
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.ngZone.run(() => {
          this.connected.next(true);
          console.log('WebSocket connected');
        });

        // Subscribe to user-specific notification queue
        this.stompClient!.subscribe('/user/queue/notifications', (message: IMessage) => {
          this.ngZone.run(() => {
            try {
              const notification = JSON.parse(message.body) as Notification;
              this.messageSubject.next(notification);
              this.notificationService.addNotification(notification);
            } catch (e) {
              console.error('Failed to parse notification message', e);
            }
          });
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        this.ngZone.run(() => {
          this.connected.next(false);
          // Fallback to polling
          this.notificationService.startPolling(15000);
        });
      },
      onWebSocketClose: () => {
        this.ngZone.run(() => {
          this.connected.next(false);
        });
      }
    });

    try {
      this.stompClient.activate();
    } catch (e) {
      console.warn('WebSocket initialization failed, using polling', e);
      this.notificationService.startPolling(15000);
    }
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      this.connected.next(false);
      console.log('WebSocket disconnected');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
