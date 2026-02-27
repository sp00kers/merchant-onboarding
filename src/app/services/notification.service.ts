import { Injectable } from '@angular/core';

export type NotificationType = 'info' | 'success' | 'error' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  show(message: string, type: NotificationType = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    const colorMap: Record<NotificationType, string> = {
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 2rem;
      border-radius: 4px;
      color: white;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      background-color: ${colorMap[type]};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }
}
