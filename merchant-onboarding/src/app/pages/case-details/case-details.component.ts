import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Case, RoleBanner } from '../../models/case.model';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
import { NotificationService } from '../../services/notification.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private caseService: CaseService,
    private notificationService: NotificationService
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
      this.caseData = this.caseService.getCaseById(caseId);
    }

    if (!this.caseData) {
      this.notificationService.show('Case not found', 'error');
      setTimeout(() => this.router.navigate(['/cases']), 2000);
      return;
    }

    this.roleBanner = this.caseService.getRoleBanner(this.roleId, 'detail');
    this.showReassign = this.roleId === 'compliance_reviewer' || this.roleId === 'admin';
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
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Approved');
        this.caseService.addHistoryItem(this.caseData.caseId, 'Case approved');
        this.caseData = this.caseService.getCaseById(this.caseData.caseId);
      }
      this.notificationService.show('Case approved successfully! Moving to next stage...', 'success');
    }
  }

  rejectCase(): void {
    if (confirm('Are you sure you want to reject this case?')) {
      if (this.caseData) {
        this.caseService.updateCaseStatus(this.caseData.caseId, 'Rejected');
        this.caseService.addHistoryItem(this.caseData.caseId, 'Case rejected');
        this.caseData = this.caseService.getCaseById(this.caseData.caseId);
      }
      this.notificationService.show('Case rejected successfully.', 'success');
    }
  }

  completeVerification(): void {
    if (confirm('Are you sure you want to mark verification as complete?')) {
      if (this.caseData) {
        this.caseService.addHistoryItem(this.caseData.caseId, 'Background verification completed');
        this.caseData = this.caseService.getCaseById(this.caseData.caseId);
      }
      this.notificationService.show('Verification completed successfully!', 'success');
    }
  }

  flagForReview(): void {
    const reason = prompt('Enter reason for flagging:');
    if (reason) {
      if (this.caseData) {
        this.caseService.addHistoryItem(this.caseData.caseId, `Flagged for review: ${reason}`);
        this.caseData = this.caseService.getCaseById(this.caseData.caseId);
      }
      this.notificationService.show('Case flagged for review successfully!', 'warning');
    }
  }

  requestReview(): void {
    if (this.caseData) {
      this.caseService.addHistoryItem(this.caseData.caseId, 'Review request sent to Compliance Team');
      this.caseData = this.caseService.getCaseById(this.caseData.caseId);
    }
    this.notificationService.show('Review request sent to Compliance Team!', 'info');
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
    this.notificationService.show('Case reassignment feature coming soon!', 'info');
    this.showActionDropdown = false;
  }

  // Comment functions
  submitComment(): void {
    const text = this.commentText.trim();
    if (!text) {
      this.notificationService.show('Please enter a comment', 'error');
      return;
    }

    if (this.caseData) {
      this.caseService.addHistoryItem(this.caseData.caseId, `Comment added: "${text}"`);
      this.caseData = this.caseService.getCaseById(this.caseData.caseId);
    }
    this.notificationService.show('Comment added successfully!', 'success');
    this.commentText = '';
  }

  clearComment(): void {
    this.commentText = '';
  }
}
