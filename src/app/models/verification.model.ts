export interface VerificationResult {
  id: number;
  caseId: string;
  verificationType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';
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
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'ALL_PASSED' | 'ISSUES_FOUND';
  recommendation: 'PENDING_VERIFICATION' | 'APPROVE' | 'REJECTION_RECOMMENDED';
}

export interface VerificationType {
  code: string;
  name: string;
  description: string;
}

export const VERIFICATION_TYPE_LABELS: { [key: string]: string } = {
  'BUSINESS_REGISTRATION': 'Business Registration Certificate',
  'DIRECTOR_ID': 'Director Government ID',
  'BENEFICIAL_OWNERSHIP': 'Beneficial Ownership Declaration'
};

export const VERIFICATION_TYPE_ICONS: { [key: string]: string } = {
  'BUSINESS_REGISTRATION': '🏢',
  'DIRECTOR_ID': '👤',
  'BENEFICIAL_OWNERSHIP': '🛡️'
};

// Compliance Review types
export interface ComplianceReviewResult {
  id: number;
  caseId: string;
  documentType: string;
  status: 'PENDING' | 'PASSED' | 'FAILED';
  reason: string | null;
  externalReference: string;
  requestedAt: string;
  completedAt: string | null;
  reviewedBy: string;
}

export interface ComplianceReviewSummary {
  caseId: string;
  totalReviews: number;
  passedCount: number;
  pendingCount: number;
  failedCount: number;
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'ALL_PASSED' | 'ISSUES_FOUND';
}

export const COMPLIANCE_TYPE_LABELS: { [key: string]: string } = {
  'BUSINESS_LICENSE': 'Business License',
  'PCI_DSS_SAQ': 'PCI DSS Self-Assessment Questionnaire',
  'TERMS_OF_SERVICE': 'Terms of Service'
};

export const COMPLIANCE_TYPE_ICONS: { [key: string]: string } = {
  'BUSINESS_LICENSE': '📄',
  'PCI_DSS_SAQ': '🔒',
  'TERMS_OF_SERVICE': '📋'
};
