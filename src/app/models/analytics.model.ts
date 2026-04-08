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
  statusDistribution: Record<string, number>;
  merchantCategoryDistribution: Record<string, number>;
  businessTypeDistribution: Record<string, number>;

  // Trends
  caseTrends: TrendData[];
  approvalTrends: TrendData[];

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

export interface VerificationStats {
  totalVerifications: number;
  completedVerifications: number;
  failedVerifications: number;
  averageConfidenceScore: number;
  verificationTypeDistribution: Record<string, number>;
}

export const STATUS_COLORS: Record<string, string> = {
  'Pending Review': '#6c757d',
  'Compliance Review': '#17a2b8',
  'Background Verification': '#007bff',
  'Approved': '#28a745',
  'Rejected': '#dc3545'
};
