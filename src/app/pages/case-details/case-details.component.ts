import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Case, RoleBanner } from '../../models/case.model';
import { DocumentExtraction, VALIDATION_STATUS_ICONS, VALIDATION_STATUS_LABELS } from '../../models/document-extraction.model';
import { FACTOR_CATEGORY_ICONS, RECOMMENDATION_LABELS, RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, RiskScore } from '../../models/risk.model';
import { VERIFICATION_TYPE_ICONS, VERIFICATION_TYPE_LABELS, VerificationResult, VerificationSummary } from '../../models/verification.model';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
import { DocumentService } from '../../services/document.service';
import { ExportService } from '../../services/export.service';
import { NotificationService } from '../../services/notification.service';
import { RiskService } from '../../services/risk.service';
import { User, UserService } from '../../services/user.service';
import { VerificationService } from '../../services/verification.service';

@Component({
  selector: 'app-case-details',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './case-details.component.html',
  styleUrl: './case-details.component.css'
})
export class CaseDetailsComponent implements OnInit {
  caseData: Case | undefined;
  roleId: string | null = null;
  roleBanner: RoleBanner | null = null;
  commentText = '';
  showActionDropdown = false;
  showActionDropdown2 = false;
  showReassign = false;
  isLoading = false;
  showExportOptions = false;

  // Assign modal properties
  showAssignModal = false;
  complianceReviewers: User[] = [];
  selectedReviewerId = '';
  isLoadingReviewers = false;

  // Verification properties
  verificationResults: VerificationResult[] = [];
  verificationSummary: VerificationSummary | null = null;
  isLoadingVerifications = false;
  isTriggering = false;
  verificationTypeLabels = VERIFICATION_TYPE_LABELS;
  verificationTypeIcons = VERIFICATION_TYPE_ICONS;

  // Risk scoring properties
  riskScore: RiskScore | null = null;
  isLoadingRisk = false;
  isCalculatingRisk = false;
  riskLevelLabels = RISK_LEVEL_LABELS;
  riskLevelColors = RISK_LEVEL_COLORS;
  recommendationLabels = RECOMMENDATION_LABELS;
  factorCategoryIcons = FACTOR_CATEGORY_ICONS;

  // Document extraction properties
  documentExtractions: DocumentExtraction[] = [];
  isLoadingExtractions = false;
  isExtractingDocuments = false;
  validationStatusLabels = VALIDATION_STATUS_LABELS;
  validationStatusIcons = VALIDATION_STATUS_ICONS;
  selectedExtraction: DocumentExtraction | null = null;
  showExtractionModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private caseService: CaseService,
    private notificationService: NotificationService,
    private userService: UserService,
    private verificationService: VerificationService,
    private riskService: RiskService,
    private documentService: DocumentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.roleId = this.authService.getCurrentRoleId();

    if (!this.roleId || !this.authService.canViewCases()) {
      this.notificationService.show('You do not have permission to view this case', 'error');
      setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      return;
    }

    const caseId = this.route.snapshot.paramMap.get('id');
    if (caseId) {
      this.loadCase(caseId);
    } else {
      this.notificationService.show('Case not found', 'error');
      setTimeout(() => this.router.navigate(['/cases']), 2000);
    }

    this.roleBanner = this.caseService.getRoleBanner(this.roleId, 'detail');
    this.showReassign = this.roleId === 'compliance_reviewer' || this.roleId === 'admin' || this.roleId === 'onboarding_officer';
  }

  loadCase(caseId: string): void {
    this.isLoading = true;
    this.caseService.getCaseById(caseId).subscribe({
      next: (caseData) => {
        this.caseData = caseData;
        this.isLoading = false;
        if (!caseData) {
          this.notificationService.show('Case not found', 'error');
          setTimeout(() => this.router.navigate(['/cases']), 2000);
        } else {
          // Load verifications
          this.loadVerifications(caseId);
          // Load risk score
          this.loadRiskScore(caseId);
          // Load document extractions
          this.loadDocumentExtractions(caseId);
        }
      },
      error: (error) => {
        console.error('Error loading case:', error);
        this.notificationService.show('Failed to load case', 'error');
        this.isLoading = false;
      }
    });
  }

  // Permission helpers
  get isComplianceOrAdmin(): boolean {
    return this.roleId === 'compliance_reviewer' || this.roleId === 'admin';
  }

  get isVerifier(): boolean {
    return this.roleId === 'verifier';
  }

  get isOnboardingOfficer(): boolean {
    return this.roleId === 'onboarding_officer';
  }

  goBackToCases(): void {
    this.router.navigate(['/cases']);
  }

  /**
   * Returns the current workflow step index (0-based) based on case status.
   * 0 = Data Entry, 1 = Compliance Review, 2 = Background Verification, 3 = Final Approval
   * -1 = Rejected
   */
  get workflowStep(): number {
    if (!this.caseData) return 0;
    const status = this.caseData.status?.toLowerCase().replace(/[\s_]+/g, '_');
    switch (status) {
      case 'draft':
      case 'pending_review':
      case 'pending review':
        return 0;
      case 'compliance_review':
      case 'compliance review':
        return 1;
      case 'background_verification':
      case 'background verification':
        return 2;
      case 'approved':
        return 3;
      case 'rejected':
        return -1;
      default:
        return 0;
    }
  }

  getStepClass(stepIndex: number): string {
    const current = this.workflowStep;
    if (current === -1) {
      // Rejected: mark steps up to where it was rejected
      return stepIndex === 0 ? 'completed' : 'rejected';
    }
    if (stepIndex < current) return 'completed';
    if (stepIndex === current) return current === 3 ? 'completed' : 'active';
    return '';
  }

  getStepCircle(stepIndex: number): string {
    const cls = this.getStepClass(stepIndex);
    if (cls === 'completed') return '✓';
    if (cls === 'rejected') return '✗';
    return String(stepIndex + 1);
  }

  // Action dropdown toggling
  toggleActionDropdown(): void {
    this.showActionDropdown = !this.showActionDropdown;
    this.showActionDropdown2 = false;
  }

  toggleActionDropdown2(): void {
    this.showActionDropdown2 = !this.showActionDropdown2;
    this.showActionDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showActionDropdown = false;
      this.showActionDropdown2 = false;
    }
  }

  // Case actions
  approveStep(): void {
    if (confirm('Are you sure you want to approve this case?')) {
      if (this.caseData) {
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Approved').subscribe({
          next: () => {
            this.caseService.addHistoryItem(this.caseData!.caseId, 'Case approved').subscribe({
              next: () => this.loadCase(this.caseData!.caseId)
            });
            this.notificationService.show('Case approved successfully! Moving to next stage...', 'success');
          },
          error: () => this.notificationService.show('Failed to approve case', 'error')
        });
      }
    }
  }

  rejectCase(): void {
    if (confirm('Are you sure you want to reject this case?')) {
      if (this.caseData) {
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Rejected').subscribe({
          next: () => {
            this.caseService.addHistoryItem(this.caseData!.caseId, 'Case rejected').subscribe({
              next: () => this.loadCase(this.caseData!.caseId)
            });
            this.notificationService.show('Case rejected successfully.', 'success');
          },
          error: () => this.notificationService.show('Failed to reject case', 'error')
        });
      }
    }
  }

  completeVerification(): void {
    if (confirm('Are you sure you want to mark verification as complete?')) {
      if (this.caseData) {
        this.caseService.addHistoryItem(this.caseData.caseId, 'Background verification completed').subscribe({
          next: () => {
            this.loadCase(this.caseData!.caseId);
            this.notificationService.show('Verification completed successfully!', 'success');
          },
          error: () => this.notificationService.show('Failed to complete verification', 'error')
        });
      }
    }
  }

  flagForReview(): void {
    const reason = prompt('Enter reason for flagging:');
    if (reason) {
      if (this.caseData) {
        this.caseService.addHistoryItem(this.caseData.caseId, `Flagged for review: ${reason}`).subscribe({
          next: () => {
            this.loadCase(this.caseData!.caseId);
            this.notificationService.show('Case flagged for review successfully!', 'warning');
          },
          error: () => this.notificationService.show('Failed to flag case', 'error')
        });
      }
    }
  }

  requestReview(): void {
    if (this.caseData) {
      this.caseService.addHistoryItem(this.caseData.caseId, 'Review request sent to Compliance Team').subscribe({
        next: () => {
          this.loadCase(this.caseData!.caseId);
          this.notificationService.show('Review request sent to Compliance Team!', 'info');
        },
        error: () => this.notificationService.show('Failed to send review request', 'error')
      });
    }
    this.showActionDropdown2 = false;
  }

  exportCase(): void {
    this.showExportOptions = !this.showExportOptions;
    this.showActionDropdown = false;
  }

  exportToCsv(): void {
    if (!this.caseData) return;
    this.notificationService.show('Exporting to CSV...', 'info');
    this.exportService.exportCaseToCsv(this.caseData.caseId);
    this.showExportOptions = false;
  }

  exportToPdf(): void {
    if (!this.caseData) return;
    this.notificationService.show('Generating PDF report...', 'info');
    this.exportService.exportCaseToPdf(this.caseData.caseId);
    this.showExportOptions = false;
  }

  assignCase(): void {
    this.showActionDropdown = false;
    this.openAssignModal();
  }

  // Assign modal methods
  openAssignModal(): void {
    this.showAssignModal = true;
    this.selectedReviewerId = '';
    this.loadComplianceReviewers();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedReviewerId = '';
  }

  loadComplianceReviewers(): void {
    this.isLoadingReviewers = true;
    this.userService.getComplianceReviewers().subscribe({
      next: (reviewers) => {
        this.complianceReviewers = reviewers.filter(r => r.status === 'active');
        this.isLoadingReviewers = false;
      },
      error: (error) => {
        console.error('Error loading compliance reviewers:', error);
        this.notificationService.show('Failed to load compliance reviewers', 'error');
        this.isLoadingReviewers = false;
      }
    });
  }

  confirmAssignment(): void {
    if (!this.selectedReviewerId) {
      this.notificationService.show('Please select a compliance reviewer', 'error');
      return;
    }

    const selectedReviewer = this.complianceReviewers.find(r => r.id === this.selectedReviewerId);
    if (!selectedReviewer || !this.caseData) {
      return;
    }

    this.caseService.assignCase(this.caseData.caseId, selectedReviewer.name).subscribe({
      next: () => {
        this.notificationService.show(`Case assigned to ${selectedReviewer.name} successfully!`, 'success');
        this.closeAssignModal();
        this.loadCase(this.caseData!.caseId);
      },
      error: (error) => {
        console.error('Error assigning case:', error);
        this.notificationService.show('Failed to assign case', 'error');
      }
    });
  }

  onAssignModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeAssignModal();
    }
  }

  // Comment functions
  submitComment(): void {
    const text = this.commentText.trim();
    if (!text) {
      this.notificationService.show('Please enter a comment', 'error');
      return;
    }

    if (this.caseData) {
      this.caseService.addHistoryItem(this.caseData.caseId, `Comment added: "${text}"`).subscribe({
        next: () => {
          this.loadCase(this.caseData!.caseId);
          this.notificationService.show('Comment added successfully!', 'success');
          this.commentText = '';
        },
        error: () => this.notificationService.show('Failed to add comment', 'error')
      });
    }
  }

  clearComment(): void {
    this.commentText = '';
  }

  // Verification methods
  loadVerifications(caseId: string): void {
    this.isLoadingVerifications = true;
    this.verificationService.getVerificationResults(caseId).subscribe({
      next: (results) => {
        this.verificationResults = results;
        this.isLoadingVerifications = false;
      },
      error: (error) => {
        console.error('Error loading verifications:', error);
        this.isLoadingVerifications = false;
      }
    });

    this.verificationService.getVerificationSummary(caseId).subscribe({
      next: (summary) => {
        this.verificationSummary = summary;
      },
      error: (error) => {
        console.error('Error loading verification summary:', error);
      }
    });
  }

  triggerAllVerifications(): void {
    if (!this.caseData) return;

    if (confirm('This will trigger all verification checks for this case. Continue?')) {
      this.isTriggering = true;
      this.verificationService.triggerAllVerifications(this.caseData.caseId).subscribe({
        next: (results) => {
          this.notificationService.show('Verification checks initiated successfully!', 'success');
          this.verificationResults = results;
          this.isTriggering = false;
          // Refresh after a delay to get updated results
          setTimeout(() => this.loadVerifications(this.caseData!.caseId), 3000);
        },
        error: (error) => {
          console.error('Error triggering verifications:', error);
          this.notificationService.show('Failed to trigger verifications', 'error');
          this.isTriggering = false;
        }
      });
    }
  }

  triggerSingleVerification(verificationType: string): void {
    if (!this.caseData) return;

    this.verificationService.triggerVerification(this.caseData.caseId, verificationType).subscribe({
      next: () => {
        this.notificationService.show(`${this.verificationTypeLabels[verificationType]} check initiated`, 'success');
        setTimeout(() => this.loadVerifications(this.caseData!.caseId), 3000);
      },
      error: (error) => {
        console.error('Error triggering verification:', error);
        this.notificationService.show('Failed to trigger verification', 'error');
      }
    });
  }

  getVerificationStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'FAILED': return 'status-failed';
      default: return '';
    }
  }

  getConfidenceClass(score: number | null): string {
    if (score === null) return '';
    if (score >= 90) return 'confidence-high';
    if (score >= 70) return 'confidence-medium';
    if (score >= 50) return 'confidence-low';
    return 'confidence-critical';
  }

  getRecommendationClass(recommendation: string): string {
    switch (recommendation) {
      case 'AUTO_APPROVE': return 'recommendation-approve';
      case 'MANUAL_REVIEW': return 'recommendation-review';
      case 'ENHANCED_DUE_DILIGENCE': return 'recommendation-enhanced';
      case 'REJECTION_RECOMMENDED': return 'recommendation-reject';
      default: return 'recommendation-pending';
    }
  }

  getRecommendationText(recommendation: string): string {
    switch (recommendation) {
      case 'AUTO_APPROVE': return 'Auto-Approve Eligible';
      case 'MANUAL_REVIEW': return 'Manual Review Required';
      case 'ENHANCED_DUE_DILIGENCE': return 'Enhanced Due Diligence';
      case 'REJECTION_RECOMMENDED': return 'Rejection Recommended';
      default: return 'Pending Verification';
    }
  }

  get canTriggerVerification(): boolean {
    return this.roleId === 'verifier' || this.roleId === 'compliance_reviewer' || this.roleId === 'admin';
  }

  // Risk scoring methods
  loadRiskScore(caseId: string): void {
    this.isLoadingRisk = true;
    this.riskService.getRiskScore(caseId).subscribe({
      next: (riskScore) => {
        this.riskScore = riskScore;
        this.isLoadingRisk = false;
      },
      error: (error) => {
        console.error('Error loading risk score:', error);
        this.isLoadingRisk = false;
      }
    });
  }

  calculateRiskScore(): void {
    if (!this.caseData) return;

    this.isCalculatingRisk = true;
    this.riskService.calculateRiskScore(this.caseData.caseId).subscribe({
      next: (riskScore) => {
        this.riskScore = riskScore;
        this.isCalculatingRisk = false;
        this.notificationService.show('Risk score calculated successfully!', 'success');
        // Reload case to get updated risk data
        this.loadCase(this.caseData!.caseId);
      },
      error: (error) => {
        console.error('Error calculating risk score:', error);
        this.notificationService.show('Failed to calculate risk score', 'error');
        this.isCalculatingRisk = false;
      }
    });
  }

  getRiskLevelClass(level: string): string {
    switch (level) {
      case 'LOW': return 'risk-low';
      case 'MEDIUM': return 'risk-medium';
      case 'HIGH': return 'risk-high';
      case 'CRITICAL': return 'risk-critical';
      default: return '';
    }
  }

  getImpactClass(impact: string): string {
    switch (impact) {
      case 'POSITIVE': return 'impact-positive';
      case 'NEGATIVE': return 'impact-negative';
      case 'NEUTRAL': return 'impact-neutral';
      default: return '';
    }
  }

  getImpactIcon(impact: string): string {
    switch (impact) {
      case 'POSITIVE': return '+';
      case 'NEGATIVE': return '-';
      case 'NEUTRAL': return '~';
      default: return '';
    }
  }

  get canCalculateRisk(): boolean {
    return this.roleId === 'verifier' || this.roleId === 'compliance_reviewer' || this.roleId === 'admin';
  }

  // Document extraction methods
  loadDocumentExtractions(caseId: string): void {
    this.isLoadingExtractions = true;
    this.documentService.getCaseExtractions(caseId).subscribe({
      next: (extractions) => {
        this.documentExtractions = extractions;
        this.isLoadingExtractions = false;
      },
      error: (error) => {
        console.error('Error loading document extractions:', error);
        this.isLoadingExtractions = false;
      }
    });
  }

  extractAllDocuments(): void {
    if (!this.caseData) return;

    if (confirm('This will process all documents with OCR. Continue?')) {
      this.isExtractingDocuments = true;
      this.documentService.extractAllDocuments(this.caseData.caseId).subscribe({
        next: () => {
          this.notificationService.show('Document extraction initiated. Results will appear shortly.', 'success');
          this.isExtractingDocuments = false;
          // Reload extractions after a delay
          setTimeout(() => this.loadDocumentExtractions(this.caseData!.caseId), 5000);
        },
        error: (error) => {
          console.error('Error extracting documents:', error);
          this.notificationService.show('Failed to extract documents', 'error');
          this.isExtractingDocuments = false;
        }
      });
    }
  }

  extractSingleDocument(documentId: number): void {
    this.documentService.extractDocument(documentId).subscribe({
      next: (extraction) => {
        this.notificationService.show('Document extraction completed!', 'success');
        // Update the extraction in the list
        const index = this.documentExtractions.findIndex(e => e.documentId === documentId);
        if (index >= 0) {
          this.documentExtractions[index] = extraction;
        } else {
          this.documentExtractions.push(extraction);
        }
      },
      error: (error) => {
        console.error('Error extracting document:', error);
        this.notificationService.show('Failed to extract document', 'error');
      }
    });
  }

  viewExtractionDetails(extraction: DocumentExtraction): void {
    this.selectedExtraction = extraction;
    this.showExtractionModal = true;
  }

  closeExtractionModal(): void {
    this.showExtractionModal = false;
    this.selectedExtraction = null;
  }

  onExtractionModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeExtractionModal();
    }
  }

  getExtractionStatusClass(status: string): string {
    switch (status) {
      case 'VALIDATED': return 'extraction-validated';
      case 'PARTIAL_MATCH': return 'extraction-partial';
      case 'MISMATCH': return 'extraction-mismatch';
      case 'FAILED': return 'extraction-failed';
      case 'PROCESSING': return 'extraction-processing';
      default: return 'extraction-pending';
    }
  }

  get canExtractDocuments(): boolean {
    return this.roleId === 'verifier' || this.roleId === 'compliance_reviewer' || this.roleId === 'admin' || this.roleId === 'onboarding_officer';
  }

  get extractedCount(): number {
    return this.documentExtractions.filter(e => e.validationStatus === 'VALIDATED' || e.validationStatus === 'PARTIAL_MATCH').length;
  }

  get mismatchCount(): number {
    return this.documentExtractions.filter(e => e.validationStatus === 'MISMATCH').length;
  }
}
