import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Case, RoleBanner } from '../../models/case.model';
import { AuthService } from '../../services/auth.service';
import { CaseService } from '../../services/case.service';
import { NotificationService } from '../../services/notification.service';
import { User, UserService } from '../../services/user.service';

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
  canEditCase = false;
  roleBanner: RoleBanner | null = null;
  isLoading = false;

  // Compliance reviewers for assignment
  complianceReviewers: User[] = [];
  isLoadingReviewers = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  filteredCases: Case[] = [];

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
    directorEmail: '',
    assignedTo: ''
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
  assignedToError = '';

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
  assignedToTouched = false;

  // All cases fetched from backend (before date filtering)
  allCases: Case[] = [];

  // File upload tracking
  selectedFiles: { [key: string]: File } = {};

  // Document validation errors
  businessLicenseError = '';
  pciDssSaqError = '';
  termsOfServiceError = '';
  businessRegCertError = '';
  directorGovIdError = '';
  beneficialOwnershipError = '';

  // Required document keys
  requiredDocuments: string[] = [
    'Business License',
    'PCI DSS SAQ',
    'Terms of Service',
    'Business Registration Certificate',
    'Director Government ID',
    'Beneficial Ownership Declaration'
  ];

  // Edit case properties
  showEditModal = false;
  editingCaseId = '';
  editingCaseStatus = '';
  editCase = {
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

  // Edit file upload tracking
  editSelectedFiles: { [key: string]: File } = {};
  existingDocuments: { [key: string]: string } = {};

  // Edit document validation errors
  editBusinessLicenseError = '';
  editPciDssSaqError = '';
  editTermsOfServiceError = '';
  editBusinessRegCertError = '';
  editDirectorGovIdError = '';
  editBeneficialOwnershipError = '';

  // Edit validation errors
  editBusinessNameError = '';
  editRegistrationNumberError = '';
  editBusinessTypeError = '';
  editMerchantCategoryError = '';
  editBusinessAddressError = '';
  editDirectorNameError = '';
  editDirectorICError = '';
  editDirectorPhoneError = '';
  editDirectorEmailError = '';
  editAssignedToError = '';

  constructor(
    private authService: AuthService,
    private caseService: CaseService,
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService
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
    this.canEditCase = ['admin', 'onboarding_officer'].includes(roleId);
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
   * Uses YYYY-MM-DD string comparison to avoid timezone issues.
   */
  applyDateFilter(): void {
    let filtered = [...this.allCases];

    if (this.dateFrom) {
      filtered = filtered.filter(c => {
        if (!c.createdDate) return false;
        const created = c.createdDate.substring(0, 10);
        return created >= this.dateFrom;
      });
    }

    if (this.dateTo) {
      filtered = filtered.filter(c => {
        if (!c.createdDate) return false;
        const created = c.createdDate.substring(0, 10);
        return created <= this.dateTo;
      });
    }

    this.filteredCases = filtered;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.cases = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.cases = this.filteredCases.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
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
    this.currentPage = 1;
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
      this.loadComplianceReviewers();
    } else {
      this.notificationService.show('You do not have permission to create cases', 'error');
    }
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
        this.isLoadingReviewers = false;
      }
    });
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  saveDraft(): void {
    const draftCase = { ...this.newCase, status: 'Draft' };
    this.caseService.saveDraftCase(draftCase).subscribe({
      next: (created) => {
        this.uploadNewDocuments(created.caseId, this.selectedFiles);
        this.notificationService.show(`Draft saved! Case ID: ${created.caseId}`, 'success');
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
    this.validateAssignedTo();
    this.validateAllDocuments();

    if (this.hasFormErrors) {
      this.notificationService.show('Please fix the errors before submitting', 'error');
      return;
    }

    this.caseService.createCase(this.newCase).subscribe({
      next: (created) => {
        this.uploadDocuments(created.caseId);
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

  onFileSelected(event: Event, fileType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles[fileType] = input.files[0];
    } else {
      delete this.selectedFiles[fileType];
    }
    this.validateDocumentField(fileType);
  }

  validateDocumentField(fileType: string): void {
    const errorMsg = this.selectedFiles[fileType] ? '' : 'This field is required';
    switch (fileType) {
      case 'Business License': this.businessLicenseError = errorMsg; break;
      case 'PCI DSS SAQ': this.pciDssSaqError = errorMsg; break;
      case 'Terms of Service': this.termsOfServiceError = errorMsg; break;
      case 'Business Registration Certificate': this.businessRegCertError = errorMsg; break;
      case 'Director Government ID': this.directorGovIdError = errorMsg; break;
      case 'Beneficial Ownership Declaration': this.beneficialOwnershipError = errorMsg; break;
    }
  }

  validateAllDocuments(): void {
    for (const doc of this.requiredDocuments) {
      this.validateDocumentField(doc);
    }
  }

  private uploadDocuments(caseId: string): void {
    const files = Object.values(this.selectedFiles);
    const types = Object.keys(this.selectedFiles);
    if (files.length === 0) return;

    this.caseService.uploadDocuments(caseId, files, types).subscribe({
      error: (err) => console.error('Document upload failed:', err)
    });
  }

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
    const address = this.newCase.businessAddress.trim();
    if (!address) {
      this.businessAddressError = 'Business address is required';
    } else if (address.length < 10) {
      this.businessAddressError = 'Business address must be at least 10 characters';
    } else {
      this.businessAddressError = '';
    }
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

  validateAssignedTo(): void {
    if (!this.assignedToTouched) return;
    this.assignedToError = this.newCase.assignedTo ? '' : 'Please select a compliance reviewer';
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
    this.assignedToTouched = true;
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
      || !this.newCase.assignedTo
      || !this.selectedFiles['Business License']
      || !this.selectedFiles['PCI DSS SAQ']
      || !this.selectedFiles['Terms of Service']
      || !this.selectedFiles['Business Registration Certificate']
      || !this.selectedFiles['Director Government ID']
      || !this.selectedFiles['Beneficial Ownership Declaration']
      || !!this.businessNameError
      || !!this.registrationNumberError
      || !!this.businessTypeError
      || !!this.merchantCategoryError
      || !!this.businessAddressError
      || !!this.directorNameError
      || !!this.directorICError
      || !!this.directorPhoneError
      || !!this.directorEmailError
      || !!this.assignedToError
      || !!this.businessLicenseError
      || !!this.pciDssSaqError
      || !!this.termsOfServiceError
      || !!this.businessRegCertError
      || !!this.directorGovIdError
      || !!this.beneficialOwnershipError;
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
    this.assignedToError = '';
    this.businessLicenseError = '';
    this.pciDssSaqError = '';
    this.termsOfServiceError = '';
    this.businessRegCertError = '';
    this.directorGovIdError = '';
    this.beneficialOwnershipError = '';
    this.businessNameTouched = false;
    this.registrationNumberTouched = false;
    this.businessTypeTouched = false;
    this.merchantCategoryTouched = false;
    this.businessAddressTouched = false;
    this.directorNameTouched = false;
    this.directorICTouched = false;
    this.directorPhoneTouched = false;
    this.directorEmailTouched = false;
    this.assignedToTouched = false;
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
      directorEmail: '',
      assignedTo: ''
    };
    this.selectedFiles = {};
  }

  onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeCreateModal();
    }
  }

  onDateFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.type = 'date';
  }

  onDateBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      input.type = 'text';
    }
  }

  // ─── Edit Case Methods ────────────────────────────────────────

  canEditCaseByStatus(c: Case): boolean {
    if (!this.canEditCase) return false;
    const status = c.status?.toLowerCase().replace(/[\s_]+/g, '_');
    return status !== 'rejected' && status !== 'approved';
  }

  openEditModal(caseId: string): void {
    this.caseService.getCaseById(caseId).subscribe({
      next: (caseData) => {
        if (!caseData) {
          this.notificationService.show('Case not found', 'error');
          return;
        }
        this.editingCaseId = caseId;
        this.editingCaseStatus = caseData.status || '';
        this.editCase = {
          businessName: caseData.businessName || '',
          registrationNumber: caseData.registrationNumber || '',
          businessType: caseData.businessType || '',
          merchantCategory: caseData.merchantCategory || '',
          businessAddress: caseData.businessAddress || '',
          directorName: caseData.directorName || '',
          directorIC: caseData.directorIC || '',
          directorPhone: caseData.directorPhone || '',
          directorEmail: caseData.directorEmail || '',
          assignedTo: caseData.assignedTo || ''
        };
        // Build existing documents map from case data
        this.existingDocuments = {};
        if (caseData.documents) {
          for (const doc of caseData.documents) {
            if (doc.type) {
              this.existingDocuments[doc.type] = doc.name;
            }
          }
        }
        this.editSelectedFiles = {};
        this.resetEditValidation();
        this.showEditModal = true;
        this.loadComplianceReviewers();
      },
      error: () => {
        this.notificationService.show('Failed to load case for editing', 'error');
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingCaseId = '';
    this.editingCaseStatus = '';
    this.editSelectedFiles = {};
    this.existingDocuments = {};
    this.resetEditValidation();
  }

  saveEditCase(): void {
    this.markAllTouched();
    this.validateEditBusinessName();
    this.validateEditRegistrationNumber();
    this.validateEditBusinessType();
    this.validateEditMerchantCategory();
    this.validateEditBusinessAddress();
    this.validateEditDirectorName();
    this.validateEditDirectorIC();
    this.validateEditDirectorPhone();
    this.validateEditDirectorEmail();
    this.validateEditAssignedTo();

    if (this.hasEditFormErrors) {
      this.notificationService.show('Please fix the errors before saving', 'error');
      return;
    }

    this.caseService.updateCase(this.editingCaseId, this.editCase).subscribe({
      next: () => {
        this.uploadNewDocuments(this.editingCaseId, this.editSelectedFiles);
        this.caseService.addHistoryItem(this.editingCaseId, 'Case details updated').subscribe();
        this.notificationService.show('Case updated successfully!', 'success');
        this.closeEditModal();
        this.loadCases();
      },
      error: (error) => {
        console.error('Error updating case:', error);
        this.notificationService.show(error?.error?.message || 'Failed to update case', 'error');
      }
    });
  }

  saveEditDraft(): void {
    this.caseService.updateDraftCase(this.editingCaseId, this.editCase).subscribe({
      next: () => {
        this.uploadNewDocuments(this.editingCaseId, this.editSelectedFiles);
        this.notificationService.show('Draft saved successfully!', 'success');
        this.closeEditModal();
        this.loadCases();
      },
      error: (error) => {
        console.error('Error saving draft:', error);
        this.notificationService.show('Failed to save draft', 'error');
      }
    });
  }

  submitEditCase(): void {
    this.markAllTouched();
    this.validateEditBusinessName();
    this.validateEditRegistrationNumber();
    this.validateEditBusinessType();
    this.validateEditMerchantCategory();
    this.validateEditBusinessAddress();
    this.validateEditDirectorName();
    this.validateEditDirectorIC();
    this.validateEditDirectorPhone();
    this.validateEditDirectorEmail();
    this.validateEditAssignedTo();
    this.validateAllEditDocuments();

    if (this.hasEditSubmitErrors) {
      this.notificationService.show('Please fix the errors before submitting', 'error');
      return;
    }

    const submitData = { ...this.editCase, status: 'Pending Review' };
    this.caseService.updateCase(this.editingCaseId, submitData).subscribe({
      next: () => {
        this.uploadNewDocuments(this.editingCaseId, this.editSelectedFiles);
        this.caseService.addHistoryItem(this.editingCaseId, 'Draft submitted — Status changed to Pending Review').subscribe();
        this.notificationService.show('Case submitted successfully!', 'success');
        this.closeEditModal();
        this.loadCases();
      },
      error: (error) => {
        console.error('Error submitting case:', error);
        this.notificationService.show(error?.error?.message || 'Failed to submit case', 'error');
      }
    });
  }

  onEditFileSelected(event: Event, fileType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editSelectedFiles[fileType] = input.files[0];
    } else {
      delete this.editSelectedFiles[fileType];
    }
    this.validateEditDocumentField(fileType);
  }

  validateEditDocumentField(fileType: string): void {
    const hasDoc = this.editSelectedFiles[fileType] || this.existingDocuments[fileType];
    const errorMsg = hasDoc ? '' : 'This field is required';
    switch (fileType) {
      case 'Business License': this.editBusinessLicenseError = errorMsg; break;
      case 'PCI DSS SAQ': this.editPciDssSaqError = errorMsg; break;
      case 'Terms of Service': this.editTermsOfServiceError = errorMsg; break;
      case 'Business Registration Certificate': this.editBusinessRegCertError = errorMsg; break;
      case 'Director Government ID': this.editDirectorGovIdError = errorMsg; break;
      case 'Beneficial Ownership Declaration': this.editBeneficialOwnershipError = errorMsg; break;
    }
  }

  validateAllEditDocuments(): void {
    for (const doc of this.requiredDocuments) {
      this.validateEditDocumentField(doc);
    }
  }

  private uploadNewDocuments(caseId: string, filesMap: { [key: string]: File }): void {
    const files = Object.values(filesMap);
    const types = Object.keys(filesMap);
    if (files.length === 0) return;
    this.caseService.uploadDocuments(caseId, files, types).subscribe({
      error: (err) => console.error('Document upload failed:', err)
    });
  }

  onEditModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeEditModal();
    }
  }

  // ─── Edit Validation Methods ──────────────────────────────────

  validateEditBusinessName(): void {
    if (!this.businessNameTouched) return;
    this.editBusinessNameError = this.editCase.businessName.trim() ? '' : 'Business name is required';
  }

  validateEditRegistrationNumber(): void {
    if (!this.registrationNumberTouched) return;
    this.editRegistrationNumberError = this.editCase.registrationNumber.trim() ? '' : 'Registration number is required';
  }

  validateEditBusinessType(): void {
    if (!this.businessTypeTouched) return;
    this.editBusinessTypeError = this.editCase.businessType ? '' : 'Please select a business type';
  }

  validateEditMerchantCategory(): void {
    if (!this.merchantCategoryTouched) return;
    this.editMerchantCategoryError = this.editCase.merchantCategory ? '' : 'Please select a merchant category';
  }

  validateEditBusinessAddress(): void {
    if (!this.businessAddressTouched) return;
    const address = this.editCase.businessAddress.trim();
    if (!address) {
      this.editBusinessAddressError = 'Business address is required';
    } else if (address.length < 10) {
      this.editBusinessAddressError = 'Business address must be at least 10 characters';
    } else {
      this.editBusinessAddressError = '';
    }
  }

  validateEditDirectorName(): void {
    if (!this.directorNameTouched) return;
    this.editDirectorNameError = this.editCase.directorName.trim() ? '' : 'Director name is required';
  }

  validateEditDirectorIC(): void {
    if (!this.directorICTouched) return;
    const ic = this.editCase.directorIC.trim();
    if (!ic) {
      this.editDirectorICError = 'Director IC number is required';
    } else if (!/^[0-9\-]+$/.test(ic)) {
      this.editDirectorICError = 'IC number must contain only numbers';
    } else {
      this.editDirectorICError = '';
    }
  }

  validateEditDirectorPhone(): void {
    if (!this.directorPhoneTouched) return;
    const phone = this.editCase.directorPhone.trim();
    if (!phone) {
      this.editDirectorPhoneError = 'Phone number is required';
    } else if (!/^\+?[0-9]+$/.test(phone)) {
      this.editDirectorPhoneError = 'Phone number must contain only numbers';
    } else {
      this.editDirectorPhoneError = '';
    }
  }

  validateEditDirectorEmail(): void {
    if (!this.directorEmailTouched) return;
    const email = this.editCase.directorEmail.trim();
    if (!email) {
      this.editDirectorEmailError = 'Email address is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      this.editDirectorEmailError = 'Please enter a valid email address';
    } else {
      this.editDirectorEmailError = '';
    }
  }

  validateEditAssignedTo(): void {
    if (!this.assignedToTouched) return;
    this.editAssignedToError = this.editCase.assignedTo ? '' : 'Please select a compliance reviewer';
  }

  get hasEditFormErrors(): boolean {
    return !this.editCase.businessName.trim()
      || !this.editCase.registrationNumber.trim()
      || !this.editCase.businessType
      || !this.editCase.merchantCategory
      || !this.editCase.businessAddress.trim()
      || !this.editCase.directorName.trim()
      || !this.editCase.directorIC.trim()
      || !this.editCase.directorPhone.trim()
      || !this.editCase.directorEmail.trim()
      || !this.editCase.assignedTo
      || !!this.editBusinessNameError
      || !!this.editRegistrationNumberError
      || !!this.editBusinessTypeError
      || !!this.editMerchantCategoryError
      || !!this.editBusinessAddressError
      || !!this.editDirectorNameError
      || !!this.editDirectorICError
      || !!this.editDirectorPhoneError
      || !!this.editDirectorEmailError
      || !!this.editAssignedToError;
  }

  get hasEditSubmitErrors(): boolean {
    const missingDoc = this.requiredDocuments.some(
      doc => !this.editSelectedFiles[doc] && !this.existingDocuments[doc]
    );
    return this.hasEditFormErrors
      || missingDoc
      || !!this.editBusinessLicenseError
      || !!this.editPciDssSaqError
      || !!this.editTermsOfServiceError
      || !!this.editBusinessRegCertError
      || !!this.editDirectorGovIdError
      || !!this.editBeneficialOwnershipError;
  }

  resetEditValidation(): void {
    this.editBusinessNameError = '';
    this.editRegistrationNumberError = '';
    this.editBusinessTypeError = '';
    this.editMerchantCategoryError = '';
    this.editBusinessAddressError = '';
    this.editDirectorNameError = '';
    this.editDirectorICError = '';
    this.editDirectorPhoneError = '';
    this.editDirectorEmailError = '';
    this.editAssignedToError = '';
    this.editBusinessLicenseError = '';
    this.editPciDssSaqError = '';
    this.editTermsOfServiceError = '';
    this.editBusinessRegCertError = '';
    this.editDirectorGovIdError = '';
    this.editBeneficialOwnershipError = '';
  }
}
