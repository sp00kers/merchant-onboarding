import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Case, RoleBanner } from '../../models/case.model';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './cases.component.html',
  styleUrl: './cases.component.css'
})
export class CasesComponent implements OnInit {
  cases: Case[] = [];
  statusFilter = '';
  searchTerm = '';
  dateFrom = '';
  dateTo = '';
  showCreateModal = false;
  canCreateCase = false;
  roleBanner: RoleBanner | null = null;
  isLoading = false;

  // Create case form fields
  newCase = {
    businessName: '',
    registrationNumber: '',
    businessType: '',
    merchantCategory: '',
    businessAddress: '',
    directorName: '',
    directorIC: '',
    directorPhone: '',
    directorEmail: ''
  };

  constructor(
    private authService: AuthService,
    private caseService: CaseService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const roleId = this.authService.getCurrentRoleId();
    if (!roleId || !this.authService.canViewCases()) {
      this.notificationService.show('You do not have permission to view cases', 'error');
      setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      return;
    }

    // Check permission async - for now use sync check
    this.canCreateCase = ['admin', 'onboarding_officer'].includes(roleId);
    this.roleBanner = this.caseService.getRoleBanner(roleId, 'list');
    this.loadCases();
  }

  loadCases(): void {
    this.isLoading = true;
    this.caseService.filterCases(this.statusFilter, this.searchTerm).subscribe({
      next: (cases) => {
        this.cases = cases;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cases:', error);
        this.notificationService.show('Failed to load cases', 'error');
        this.isLoading = false;
      }
    });
  }

  filterCases(): void {
    this.loadCases();
  }

  searchCases(): void {
    this.loadCases();
  }

  viewCase(caseId: string): void {
    this.router.navigate(['/cases', caseId]);
  }

  openCreateModal(): void {
    const roleId = this.authService.getCurrentRoleId();
    if (roleId && ['admin', 'onboarding_officer'].includes(roleId)) {
      this.showCreateModal = true;
    } else {
      this.notificationService.show('You do not have permission to create cases', 'error');
    }
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  saveDraft(): void {
    this.caseService.createCase(this.newCase).subscribe({
      next: () => {
        this.notificationService.show('Case saved as draft successfully!', 'success');
        this.closeCreateModal();
        this.loadCases();
      },
      error: (error) => {
        console.error('Error saving draft:', error);
        this.notificationService.show('Failed to save draft', 'error');
      }
    });
  }

  submitCase(): void {
    const requiredFields: (keyof typeof this.newCase)[] = [
      'businessName', 'registrationNumber', 'businessType',
      'merchantCategory', 'businessAddress', 'directorName',
      'directorIC', 'directorPhone', 'directorEmail'
    ];

    for (const field of requiredFields) {
      if (!this.newCase[field]) {
        const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        this.notificationService.show(`Please fill in the ${label}`, 'error');
        return;
      }
    }

    this.caseService.createCase(this.newCase).subscribe({
      next: (created) => {
        this.notificationService.show(`Case submitted successfully! Case ID: ${created.caseId}`, 'success');
        this.closeCreateModal();
        this.loadCases();
      },
      error: (error) => {
        console.error('Error submitting case:', error);
        this.notificationService.show('Failed to submit case', 'error');
      }
    });
  }

  private resetForm(): void {
    this.newCase = {
      businessName: '',
      registrationNumber: '',
      businessType: '',
      merchantCategory: '',
      businessAddress: '',
      directorName: '',
      directorIC: '',
      directorPhone: '',
      directorEmail: ''
    };
  }

  onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeCreateModal();
    }
  }
}
