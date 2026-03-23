export interface DocumentExtraction {
  id: number;
  documentId: number;
  documentName: string;
  documentType: string;
  rawText: string;
  extractedBusinessName: string | null;
  extractedRegistrationNumber: string | null;
  extractedDirectorName: string | null;
  extractedDirectorIC: string | null;
  extractedAddress: string | null;
  confidenceScore: number | null;
  validationStatus: 'PENDING' | 'PROCESSING' | 'VALIDATED' | 'PARTIAL_MATCH' | 'MISMATCH' | 'FAILED';
  validationNotes: string | null;
  extractedAt: string;
  validatedAt: string | null;
}

export interface ExtractionSummary {
  caseId: string;
  totalDocuments: number;
  processedCount: number;
  validatedCount: number;
  mismatchCount: number;
  averageConfidenceScore: number | null;
  overallStatus: string;
}

export const VALIDATION_STATUS_LABELS: Record<string, string> = {
  'PENDING': 'Pending',
  'PROCESSING': 'Processing',
  'VALIDATED': 'Validated',
  'PARTIAL_MATCH': 'Partial Match',
  'MISMATCH': 'Mismatch',
  'FAILED': 'Failed'
};

export const VALIDATION_STATUS_ICONS: Record<string, string> = {
  'PENDING': '⏳',
  'PROCESSING': '🔄',
  'VALIDATED': '✅',
  'PARTIAL_MATCH': '⚠️',
  'MISMATCH': '❌',
  'FAILED': '💥'
};
