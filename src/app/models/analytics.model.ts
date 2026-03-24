export interface Analytics {
  // Overall Statistics
  totalCases: number;
  pendingCases: number;
  approvedCases: number;
  rejectedCases: number;
  inProgressCases: number;

  // Processing Stats
  averageProcessingTime: number;
  approvalRate: number;
  rejectionRate: number;

  // Distributions
  riskDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  merchantCategoryDistribution: Record<string, number>;
  businessTypeDistribution: Record<string, number>;

  // Trends
  caseTrends: TrendData[];
  approvalTrends: TrendData[];

  // Top Performers
  topReviewers: UserPerformance[];

  // Verification Stats
  verificationStats?: VerificationStats;
}

export interface TrendData {
  period: string;
  totalCases: number;
  approvedCases: number;
  rejectedCases: number;
  pendingCases: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  casesProcessed: number;
  averageProcessingTime: number;
  approvalRate: number;
}

export interface VerificationStats {
  totalVerifications: number;
  completedVerifications: number;
  failedVerifications: number;
  averageConfidenceScore: number;
  verificationTypeDistribution: Record<string, number>;
}

export const RISK_LEVEL_COLORS: Record<string, string> = {
  'LOW': '#28a745',
  'MEDIUM': '#ffc107',
  'HIGH': '#fd7e14',
  'CRITICAL': '#dc3545',
  'UNASSESSED': '#6c757d'
};

export const STATUS_COLORS: Record<string, string> = {
  'Pending Review': '#6c757d',
  'Compliance Review': '#17a2b8',
  'Background Verification': '#007bff',
  'Approved': '#28a745',
  'Rejected': '#dc3545'
};
