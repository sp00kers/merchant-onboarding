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

    this.canCreateCase = this.authService.hasPermission('case_creation');
    this.roleBanner = this.caseService.getRoleBanner(roleId, 'list');
    this.loadCases();
  }

  loadCases(): void {
    this.cases = this.caseService.filterCases(this.statusFilter, this.searchTerm);
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
    if (this.authService.hasPermission('case_creation')) {
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
    this.caseService.createCase(this.newCase);
    this.notificationService.show('Case saved as draft successfully!', 'success');
    this.closeCreateModal();
    this.loadCases();
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

    const created = this.caseService.createCase(this.newCase);
    this.notificationService.show(`Case submitted successfully! Case ID: ${created.caseId}`, 'success');
    this.closeCreateModal();
    this.loadCases();
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
