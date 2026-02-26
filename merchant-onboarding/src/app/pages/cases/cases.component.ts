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

  // Validation errors
  businessNameError = '';
  registrationNumberError = '';
  businessTypeError = '';
  merchantCategoryError = '';
  businessAddressError = '';
  directorNameError = '';
  directorICError = '';
  directorPhoneError = '';
  directorEmailError = '';

  // Touched flags
  businessNameTouched = false;
  registrationNumberTouched = false;
  businessTypeTouched = false;
  merchantCategoryTouched = false;
  businessAddressTouched = false;
  directorNameTouched = false;
  directorICTouched = false;
  directorPhoneTouched = false;
  directorEmailTouched = false;

  // All cases fetched from backend (before date filtering)
  allCases: Case[] = [];

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
        this.allCases = cases;
        this.applyDateFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cases:', error);
        this.notificationService.show('Failed to load cases', 'error');
        this.isLoading = false;
      }
    });
  }

  /**
   * Apply client-side date range filter on the Created Date field.
   */
  applyDateFilter(): void {
    let filtered = [...this.allCases];

    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(c => {
        const created = new Date(c.createdDate);
        return created >= from;
      });
    }

    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => {
        const created = new Date(c.createdDate);
        return created <= to;
      });
    }

    this.cases = filtered;
  }

  /**
   * Triggered by the Search button click.
   * Sends search term + status to backend, then applies date range client-side.
   */
  searchCases(): void {
    this.loadCases();
  }

  /**
   * Resets all filters and reloads all cases.
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.loadCases();
  }

  viewCase(caseId: string): void {
    this.router.navigate(['/cases', caseId]);
  }

  openCreateModal(): void {
    const roleId = this.authService.getCurrentRoleId();
    if (roleId && ['admin', 'onboarding_officer'].includes(roleId)) {
      this.resetValidation();
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
    this.markAllTouched();
    this.validateBusinessName();
    this.validateRegistrationNumber();
    this.validateBusinessType();
    this.validateMerchantCategory();
    this.validateBusinessAddress();
    this.validateDirectorName();
    this.validateDirectorIC();
    this.validateDirectorPhone();
    this.validateDirectorEmail();

    if (this.hasFormErrors) {
      this.notificationService.show('Please fix the errors before submitting', 'error');
      return;
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

  // ─── Validation Methods ───────────────────────────────────────

  validateBusinessName(): void {
    if (!this.businessNameTouched) return;
    this.businessNameError = this.newCase.businessName.trim() ? '' : 'Business name is required';
  }

  validateRegistrationNumber(): void {
    if (!this.registrationNumberTouched) return;
    this.registrationNumberError = this.newCase.registrationNumber.trim() ? '' : 'Registration number is required';
  }

  validateBusinessType(): void {
    if (!this.businessTypeTouched) return;
    this.businessTypeError = this.newCase.businessType ? '' : 'Please select a business type';
  }

  validateMerchantCategory(): void {
    if (!this.merchantCategoryTouched) return;
    this.merchantCategoryError = this.newCase.merchantCategory ? '' : 'Please select a merchant category';
  }

  validateBusinessAddress(): void {
    if (!this.businessAddressTouched) return;
    this.businessAddressError = this.newCase.businessAddress.trim() ? '' : 'Business address is required';
  }

  validateDirectorName(): void {
    if (!this.directorNameTouched) return;
    this.directorNameError = this.newCase.directorName.trim() ? '' : 'Director name is required';
  }

  validateDirectorIC(): void {
    if (!this.directorICTouched) return;
    const ic = this.newCase.directorIC.trim();
    if (!ic) {
      this.directorICError = 'Director IC number is required';
    } else if (!/^[0-9\-]+$/.test(ic)) {
      this.directorICError = 'IC number must contain only numbers';
    } else {
      this.directorICError = '';
    }
  }

  validateDirectorPhone(): void {
    if (!this.directorPhoneTouched) return;
    const phone = this.newCase.directorPhone.trim();
    if (!phone) {
      this.directorPhoneError = 'Phone number is required';
    } else if (!/^\+?[0-9]+$/.test(phone)) {
      this.directorPhoneError = 'Phone number must contain only numbers';
    } else {
      this.directorPhoneError = '';
    }
  }

  validateDirectorEmail(): void {
    if (!this.directorEmailTouched) return;
    const email = this.newCase.directorEmail.trim();
    if (!email) {
      this.directorEmailError = 'Email address is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      this.directorEmailError = 'Please enter a valid email address';
    } else {
      this.directorEmailError = '';
    }
  }

  markAllTouched(): void {
    this.businessNameTouched = true;
    this.registrationNumberTouched = true;
    this.businessTypeTouched = true;
    this.merchantCategoryTouched = true;
    this.businessAddressTouched = true;
    this.directorNameTouched = true;
    this.directorICTouched = true;
    this.directorPhoneTouched = true;
    this.directorEmailTouched = true;
  }

  get hasFormErrors(): boolean {
    return !this.newCase.businessName.trim()
      || !this.newCase.registrationNumber.trim()
      || !this.newCase.businessType
      || !this.newCase.merchantCategory
      || !this.newCase.businessAddress.trim()
      || !this.newCase.directorName.trim()
      || !this.newCase.directorIC.trim()
      || !this.newCase.directorPhone.trim()
      || !this.newCase.directorEmail.trim()
      || !!this.businessNameError
      || !!this.registrationNumberError
      || !!this.businessTypeError
      || !!this.merchantCategoryError
      || !!this.businessAddressError
      || !!this.directorNameError
      || !!this.directorICError
      || !!this.directorPhoneError
      || !!this.directorEmailError;
  }

  resetValidation(): void {
    this.businessNameError = '';
    this.registrationNumberError = '';
    this.businessTypeError = '';
    this.merchantCategoryError = '';
    this.businessAddressError = '';
    this.directorNameError = '';
    this.directorICError = '';
    this.directorPhoneError = '';
    this.directorEmailError = '';
    this.businessNameTouched = false;
    this.registrationNumberTouched = false;
    this.businessTypeTouched = false;
    this.merchantCategoryTouched = false;
    this.businessAddressTouched = false;
    this.directorNameTouched = false;
    this.directorICTouched = false;
    this.directorPhoneTouched = false;
    this.directorEmailTouched = false;
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
