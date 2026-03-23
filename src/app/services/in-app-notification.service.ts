import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, startWith, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification, NotificationPage, UnreadCount } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  startPolling(intervalMs: number = 30000): void {
    interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount())
    ).subscribe(response => {
      this.unreadCountSubject.next(response.count);
    });
  }

  refreshNotifications(): void {
    this.getRecentNotifications().subscribe(notifications => {
      this.notificationsSubject.next(notifications);
    });
    this.getUnreadCount().subscribe(response => {
      this.unreadCountSubject.next(response.count);
    });
  }

  getNotifications(page: number = 0, size: number = 20): Observable<NotificationPage> {
    return this.http.get<NotificationPage>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getRecentNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/recent`).pipe(
      tap(notifications => this.notificationsSubject.next(notifications))
    );
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/unread`);
  }

  getUnreadCount(): Observable<UnreadCount> {
    return this.http.get<UnreadCount>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => this.unreadCountSubject.next(response.count))
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        if (current > 0) {
          this.unreadCountSubject.next(current - 1);
        }
        // Update local notifications list
        const notifications = this.notificationsSubject.value.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(notifications);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
        const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(notifications);
      })
    );
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.filter(n => n.id !== id);
        this.notificationsSubject.next(notifications);
        this.refreshNotifications();
      })
    );
  }

  // Add a notification locally (for WebSocket messages)
  addNotification(notification: Notification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current.slice(0, 9)]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }
}
