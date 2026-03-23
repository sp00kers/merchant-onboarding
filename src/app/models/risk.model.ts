export interface RiskScore {
  totalScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  factors: RiskFactor[];
  calculatedAt: string;
}

export interface RiskFactor {
  name: string;
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export const RISK_LEVEL_COLORS: { [key: string]: string } = {
  LOW: '#28a745',
  MEDIUM: '#ffc107',
  HIGH: '#fd7e14',
  CRITICAL: '#dc3545'
};

export const RISK_LEVEL_LABELS: { [key: string]: string } = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Risk'
};

export const RECOMMENDATION_LABELS: { [key: string]: string } = {
  AUTO_APPROVE: 'Auto-Approve Eligible',
  MANUAL_REVIEW: 'Manual Review Required',
  ENHANCED_DUE_DILIGENCE: 'Enhanced Due Diligence',
  REJECTION_RECOMMENDED: 'Rejection Recommended'
};

export const FACTOR_CATEGORY_ICONS: { [key: string]: string } = {
  STRUCTURE: '🏢',
  BUSINESS: '📊',
  VERIFICATION: '✅',
  DOCUMENTATION: '📄',
  DATA: '📝'
};
