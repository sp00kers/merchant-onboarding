import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Case, RoleBanner } from '../../models/case.model';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
import { NotificationService } from '../../services/notification.service';
import { User, UserService } from '../../services/user.service';

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

  // Assign modal properties
  showAssignModal = false;
  complianceReviewers: User[] = [];
  selectedReviewerId = '';
  isLoadingReviewers = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private caseService: CaseService,
    private notificationService: NotificationService,
    private userService: UserService
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
    this.notificationService.show('Exporting case details...', 'info');
    setTimeout(() => {
      this.notificationService.show('Case exported successfully!', 'success');
    }, 1500);
    this.showActionDropdown = false;
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
}
