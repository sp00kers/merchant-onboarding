export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'CASE_STATUS' | 'VERIFICATION' | 'ASSIGNMENT' | 'SYSTEM';
  relatedEntityType: string;
  relatedEntityId: string;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UnreadCount {
  count: number;
}
