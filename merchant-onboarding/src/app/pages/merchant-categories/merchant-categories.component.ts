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
  isLoading = false;

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
    this.isLoading = true;
    this.paramsService.filterMerchantCategories(this.searchTerm, this.statusFilter, this.riskFilter).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading merchant categories:', error);
        this.notificationService.show('Failed to load merchant categories', 'error');
        this.isLoading = false;
      }
    });
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
    this.paramsService.getMerchantCategoryById(id).subscribe({
      next: (item) => {
        if (item) {
          this.currentEditingId = id;
          this.modalTitle = 'Edit Merchant Category';
          this.form = {
            code: item.code, name: item.name, description: item.description || '',
            riskLevel: item.riskLevel, status: item.status
          };
          this.codeDisabled = true;
          this.showModal = true;
        }
      },
      error: (error) => {
        console.error('Error loading merchant category:', error);
        this.notificationService.show('Failed to load merchant category', 'error');
      }
    });
  }

  save(): void {
    const code = this.form.code.trim().toUpperCase();
    const name = this.form.name.trim();
    const riskLevel = this.form.riskLevel;
    if (!code || !name || !riskLevel) {
      this.notificationService.show('Please fill in all required fields', 'error');
      return;
    }

    const data = { code, name, description: this.form.description.trim(), riskLevel: riskLevel as 'low' | 'medium' | 'high', status: this.form.status };

    if (this.currentEditingId) {
      this.paramsService.updateMerchantCategory(this.currentEditingId, data).subscribe({
        next: () => {
          this.notificationService.show('Merchant category updated successfully!', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating merchant category:', error);
          this.notificationService.show('Failed to update merchant category', 'error');
        }
      });
    } else {
      this.paramsService.createMerchantCategory(data).subscribe({
        next: () => {
          this.notificationService.show('Merchant category created successfully!', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating merchant category:', error);
          this.notificationService.show('Failed to create merchant category', 'error');
        }
      });
    }
  }

  deleteItem(id: string): void {
    const item = this.categories.find(c => c.id === id);
    if (item && confirm(`Are you sure you want to delete merchant category "${item.name}"? This action cannot be undone.`)) {
      this.paramsService.deleteMerchantCategory(id).subscribe({
        next: () => {
          this.notificationService.show('Merchant category deleted successfully!', 'success');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting merchant category:', error);
          this.notificationService.show('Failed to delete merchant category', 'error');
        }
      });
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
