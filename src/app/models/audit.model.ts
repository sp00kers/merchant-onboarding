export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  status: string;
  details: string;
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AuditStats {
  actionsLast24Hours: number;
  actionsLast7Days: number;
  loginFailuresLast24Hours: number;
}
