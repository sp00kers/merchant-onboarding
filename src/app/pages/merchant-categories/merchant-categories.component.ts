import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { MerchantCategory } from '../../models/business-params.model';
import { BusinessParamsService } from '../../services/business-params.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-merchant-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './merchant-categories.component.html',
  styleUrl: './merchant-categories.component.css'
})
export class MerchantCategoriesComponent implements OnInit {
  categories: MerchantCategory[] = [];
  searchTerm = '';
  statusFilter = '';
  riskFilter = '';
  showModal = false;
  modalTitle = 'Add Merchant Category';
  currentEditingId: string | null = null;

  form = {
    code: '', name: '', description: '',
    riskLevel: '' as '' | 'low' | 'medium' | 'high',
    status: 'active' as 'active' | 'inactive'
  };
  codeDisabled = false;

  constructor(
    private paramsService: BusinessParamsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.categories = this.paramsService.filterMerchantCategories(this.searchTerm, this.statusFilter, this.riskFilter);
  }

  filter(): void {
    this.loadData();
  }

  openCreateModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add Merchant Category';
    this.form = { code: '', name: '', description: '', riskLevel: '', status: 'active' };
    this.codeDisabled = false;
    this.showModal = true;
  }

  editItem(id: string): void {
    const item = this.paramsService.getMerchantCategoryById(id);
    if (item) {
      this.currentEditingId = id;
      this.modalTitle = 'Edit Merchant Category';
      this.form = {
        code: item.code, name: item.name, description: item.description,
        riskLevel: item.riskLevel, status: item.status
      };
      this.codeDisabled = true;
      this.showModal = true;
    }
  }

  save(): void {
    const code = this.form.code.trim().toUpperCase();
    const name = this.form.name.trim();
    const riskLevel = this.form.riskLevel;
    if (!code || !name || !riskLevel) {
      this.notificationService.show('Please fill in all required fields', 'error');
      return;
    }
    const result = this.paramsService.saveMerchantCategory(
      { code, name, description: this.form.description.trim(), riskLevel: riskLevel as 'low' | 'medium' | 'high', status: this.form.status },
      this.currentEditingId
    );
    this.notificationService.show(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      this.closeModal();
      this.loadData();
    }
  }

  deleteItem(id: string): void {
    const item = this.paramsService.getMerchantCategoryById(id);
    if (item && confirm(`Are you sure you want to delete merchant category "${item.name}"? This action cannot be undone.`)) {
      this.paramsService.deleteMerchantCategory(id);
      this.notificationService.show('Merchant category deleted successfully!', 'success');
      this.loadData();
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeModal();
    }
  }

  formatDate(dateString: string): string {
    return this.paramsService.formatDate(dateString);
  }
}
