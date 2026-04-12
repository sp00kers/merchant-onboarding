import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Case, RoleBanner } from '../../models/case.model';
import { VERIFICATION_TYPE_ICONS, VERIFICATION_TYPE_LABELS, VerificationResult, VerificationSummary } from '../../models/verification.model';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
import { ExportService } from '../../services/export.service';
import { NotificationService } from '../../services/notification.service';
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

  // Edit case properties
  showEditModal = false;
  editCaseData = {
    businessName: '',
    registrationNumber: '',
    businessType: '',
    merchantCategory: '',
    businessAddress: '',
    directorName: '',
    directorIC: '',
    directorPhone: '',
    directorEmail: '',
    assignedTo: ''
  };
  editErrors: Record<string, string> & {
    businessName: string; registrationNumber: string; businessType: string;
    merchantCategory: string; businessAddress: string; directorName: string;
    directorIC: string; directorPhone: string; directorEmail: string; assignedTo: string;
  } = {
    businessName: '', registrationNumber: '', businessType: '',
    merchantCategory: '', businessAddress: '', directorName: '',
    directorIC: '', directorPhone: '', directorEmail: '', assignedTo: ''
  };
  editTouched: Record<string, boolean> & {
    businessName: boolean; registrationNumber: boolean; businessType: boolean;
    merchantCategory: boolean; businessAddress: boolean; directorName: boolean;
    directorIC: boolean; directorPhone: boolean; directorEmail: boolean; assignedTo: boolean;
  } = {
    businessName: false, registrationNumber: false, businessType: false,
    merchantCategory: false, businessAddress: false, directorName: false,
    directorIC: false, directorPhone: false, directorEmail: false, assignedTo: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private caseService: CaseService,
    private notificationService: NotificationService,
    private userService: UserService,
    private verificationService: VerificationService,
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

  /**
   * The assigned compliance reviewer or an admin can approve/reject cases.
   */
  get canAuthorizeCase(): boolean {
    if (this.roleId === 'admin') {
      return true;
    }
    if (this.roleId === 'compliance_reviewer') {
      const currentUserName = this.authService.getCurrentUser()?.user?.name;
      return !!currentUserName && currentUserName === this.caseData?.assignedTo;
    }
    return false;
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

  // Document category filters
  private readonly bgVerificationDocTypes = [
    'Business Registration Certificate', 'Director Government ID', 'Beneficial Ownership Declaration'
  ];
  private readonly complianceDocTypes = [
    'Business License', 'PCI DSS SAQ', 'Terms of Service'
  ];

  get backgroundVerificationDocs() {
    return this.caseData?.documents?.filter(d => this.bgVerificationDocTypes.includes(d.name)) ?? [];
  }

  get complianceReviewDocs() {
    return this.caseData?.documents?.filter(d => this.complianceDocTypes.includes(d.name)) ?? [];
  }

  /**
   * Returns the current workflow step index (0-based) based on case status.
   * 0 = Data Entry, 1 = Pending Review, 2 = Background Verification, 3 = Compliance Review, 4 = Final Approval
   * -1 = Rejected
   */
  get workflowStep(): number {
    if (!this.caseData) return 1;
    const status = this.caseData.status?.toLowerCase().replace(/[\s_]+/g, '_');
    switch (status) {
      case 'draft':
        return 0;
      case 'pending_review':
      case 'pending review':
        return 1;
      case 'background_verification':
      case 'background verification':
        return 2;
      case 'compliance_review':
      case 'compliance review':
        return 3;
      case 'approved':
        return 4;
      case 'rejected':
        return -1;
      default:
        return 1;
    }
  }

  getStepClass(stepIndex: number): string {
    const current = this.workflowStep;
    if (current === -1) {
      // Rejected: mark steps up to where it was rejected
      return stepIndex === 0 ? 'completed' : 'rejected';
    }
    if (stepIndex < current) return 'completed';
    if (stepIndex === current) return current === 4 ? 'completed' : 'active';
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
    if (!this.caseData) return;
    const status = this.caseData.status?.toLowerCase().replace(/[\s_]+/g, '_');

    if (status === 'pending_review' || status === 'pending review') {
      // Pending Review → Background Verification
      if (confirm('Approve this case to proceed to Background Verification?')) {
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Background Verification').subscribe({
          next: () => {
            this.caseService.addHistoryItem(this.caseData!.caseId, 'Case approved for background verification').subscribe({
              next: () => this.loadCase(this.caseData!.caseId)
            });
            this.notificationService.show('Case approved! Moving to Background Verification...', 'success');
          },
          error: () => this.notificationService.show('Failed to approve case', 'error')
        });
      }
    } else if (status === 'compliance_review' || status === 'compliance review') {
      // Compliance Review → Approved
      if (confirm('Are you sure you want to give final approval for this case?')) {
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Approved').subscribe({
          next: () => {
            this.caseService.addHistoryItem(this.caseData!.caseId, 'Case approved — final approval granted').subscribe({
              next: () => this.loadCase(this.caseData!.caseId)
            });
            this.notificationService.show('Case approved successfully!', 'success');
          },
          error: () => this.notificationService.show('Failed to approve case', 'error')
        });
      }
    } else {
      // Default fallback
      if (confirm('Are you sure you want to approve this case?')) {
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Approved').subscribe({
          next: () => {
            this.caseService.addHistoryItem(this.caseData!.caseId, 'Case approved').subscribe({
              next: () => this.loadCase(this.caseData!.caseId)
            });
            this.notificationService.show('Case approved successfully!', 'success');
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
    if (confirm('Are you sure you want to mark verification as complete? This will move the case to Compliance Review.')) {
      if (this.caseData) {
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Compliance Review').subscribe({
          next: () => {
            this.caseService.addHistoryItem(this.caseData!.caseId, 'Background verification completed — moving to Compliance Review').subscribe({
              next: () => this.loadCase(this.caseData!.caseId)
            });
            this.notificationService.show('Verification completed! Moving to Compliance Review...', 'success');
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

  // ─── Edit Case Methods ────────────────────────────────────────

  get canEditCase(): boolean {
    if (!this.caseData) return false;
    const status = this.caseData.status?.toLowerCase().replace(/[\s_]+/g, '_');
    if (status === 'rejected' || status === 'approved') return false;
    return this.roleId === 'onboarding_officer' || this.roleId === 'admin';
  }

  openEditModal(): void {
    if (!this.caseData) return;
    this.showActionDropdown = false;
    this.editCaseData = {
      businessName: this.caseData.businessName || '',
      registrationNumber: this.caseData.registrationNumber || '',
      businessType: this.caseData.businessType || '',
      merchantCategory: this.caseData.merchantCategory || '',
      businessAddress: this.caseData.businessAddress || '',
      directorName: this.caseData.directorName || '',
      directorIC: this.caseData.directorIC || '',
      directorPhone: this.caseData.directorPhone || '',
      directorEmail: this.caseData.directorEmail || '',
      assignedTo: this.caseData.assignedTo || ''
    };
    this.editErrors = {
      businessName: '', registrationNumber: '', businessType: '',
      merchantCategory: '', businessAddress: '', directorName: '',
      directorIC: '', directorPhone: '', directorEmail: '', assignedTo: ''
    };
    this.editTouched = {
      businessName: false, registrationNumber: false, businessType: false,
      merchantCategory: false, businessAddress: false, directorName: false,
      directorIC: false, directorPhone: false, directorEmail: false, assignedTo: false
    };
    this.showEditModal = true;
    this.loadComplianceReviewers();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editErrors = {
      businessName: '', registrationNumber: '', businessType: '',
      merchantCategory: '', businessAddress: '', directorName: '',
      directorIC: '', directorPhone: '', directorEmail: '', assignedTo: ''
    };
    this.editTouched = {
      businessName: false, registrationNumber: false, businessType: false,
      merchantCategory: false, businessAddress: false, directorName: false,
      directorIC: false, directorPhone: false, directorEmail: false, assignedTo: false
    };
  }

  saveEditCase(): void {
    // Mark all touched
    const fields = ['businessName', 'registrationNumber', 'businessType', 'merchantCategory',
      'businessAddress', 'directorName', 'directorIC', 'directorPhone', 'directorEmail', 'assignedTo'];
    fields.forEach(f => {
      this.editTouched[f] = true;
      this.validateEditField(f);
    });

    if (this.hasEditFormErrors) {
      this.notificationService.show('Please fix the errors before saving', 'error');
      return;
    }

    this.caseService.updateCase(this.caseData!.caseId, this.editCaseData).subscribe({
      next: () => {
        this.caseService.addHistoryItem(this.caseData!.caseId, 'Case details updated').subscribe();
        this.notificationService.show('Case updated successfully!', 'success');
        this.closeEditModal();
        this.loadCase(this.caseData!.caseId);
      },
      error: (error) => {
        console.error('Error updating case:', error);
        this.notificationService.show(error?.error?.message || 'Failed to update case', 'error');
      }
    });
  }

  validateEditField(field: string): void {
    if (!this.editTouched[field]) return;
    const val = (this.editCaseData as any)[field]?.trim?.() ?? (this.editCaseData as any)[field];

    switch (field) {
      case 'businessName':
        this.editErrors[field] = val ? '' : 'Business name is required';
        break;
      case 'registrationNumber':
        this.editErrors[field] = val ? '' : 'Registration number is required';
        break;
      case 'businessType':
        this.editErrors[field] = val ? '' : 'Please select a business type';
        break;
      case 'merchantCategory':
        this.editErrors[field] = val ? '' : 'Please select a merchant category';
        break;
      case 'businessAddress':
        if (!val) this.editErrors[field] = 'Business address is required';
        else if (val.length < 10) this.editErrors[field] = 'Business address must be at least 10 characters';
        else this.editErrors[field] = '';
        break;
      case 'directorName':
        this.editErrors[field] = val ? '' : 'Director name is required';
        break;
      case 'directorIC':
        if (!val) this.editErrors[field] = 'Director IC number is required';
        else if (!/^[0-9\-]+$/.test(val)) this.editErrors[field] = 'IC number must contain only numbers';
        else this.editErrors[field] = '';
        break;
      case 'directorPhone':
        if (!val) this.editErrors[field] = 'Phone number is required';
        else if (!/^\+?[0-9]+$/.test(val)) this.editErrors[field] = 'Phone number must contain only numbers';
        else this.editErrors[field] = '';
        break;
      case 'directorEmail':
        if (!val) this.editErrors[field] = 'Email address is required';
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) this.editErrors[field] = 'Please enter a valid email address';
        else this.editErrors[field] = '';
        break;
      case 'assignedTo':
        this.editErrors[field] = val ? '' : 'Please select a compliance reviewer';
        break;
    }
  }

  get hasEditFormErrors(): boolean {
    const d = this.editCaseData;
    return !d.businessName.trim() || !d.registrationNumber.trim() || !d.businessType
      || !d.merchantCategory || !d.businessAddress.trim() || !d.directorName.trim()
      || !d.directorIC.trim() || !d.directorPhone.trim() || !d.directorEmail.trim()
      || !d.assignedTo
      || Object.values(this.editErrors).some(e => !!e);
  }

  onEditModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeEditModal();
    }
  }

}
