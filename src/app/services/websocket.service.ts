import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';
import { InAppNotificationService } from './in-app-notification.service';
import { environment } from '../../environments/environment';

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
    private notificationService: InAppNotificationService
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

    const wsUrl = environment.apiUrl.replace('/api', '/ws');

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {},  // Disable debug logging
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected.next(true);
        console.log('WebSocket connected');

        // Subscribe to user-specific notification queue
        this.stompClient!.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body) as Notification;
            this.messageSubject.next(notification);
            this.notificationService.addNotification(notification);
          } catch (e) {
            console.error('Failed to parse notification message', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        this.connected.next(false);
        // Fallback to polling
        this.notificationService.startPolling(15000);
      },
      onWebSocketClose: () => {
        this.connected.next(false);
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
