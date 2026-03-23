export interface VerificationResult {
  id: number;
  caseId: string;
  verificationType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  confidenceScore: number | null;
  externalReference: string;
  responseData: string;
  riskIndicators: string;
  requestedAt: string;
  completedAt: string | null;
  verifiedBy: string;
  notes: string;
}

export interface VerificationSummary {
  caseId: string;
  totalVerifications: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  averageConfidenceScore: number;
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ISSUES_FOUND';
  recommendation: 'PENDING_VERIFICATION' | 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'ENHANCED_DUE_DILIGENCE' | 'REJECTION_RECOMMENDED';
}

export interface VerificationType {
  code: string;
  name: string;
  description: string;
}

export const VERIFICATION_TYPE_LABELS: { [key: string]: string } = {
  'BUSINESS_REGISTRY': 'Business Registry',
  'DIRECTOR_IDENTITY': 'Director Identity',
  'ADDRESS': 'Address Verification',
  'FINANCIAL': 'Financial Check'
};

export const VERIFICATION_TYPE_ICONS: { [key: string]: string } = {
  'BUSINESS_REGISTRY': '🏢',
  'DIRECTOR_IDENTITY': '👤',
  'ADDRESS': '📍',
  'FINANCIAL': '💰'
};
