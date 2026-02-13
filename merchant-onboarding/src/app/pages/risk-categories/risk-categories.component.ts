import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RiskCategory } from '../../models/business-params.model';
import { BusinessParamsService } from '../../services/business-params.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-risk-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './risk-categories.component.html',
  styleUrl: './risk-categories.component.css'
})
export class RiskCategoriesComponent implements OnInit {
  categories: RiskCategory[] = [];
  searchTerm = '';
  showModal = false;
  modalTitle = 'Add Risk Category';
  currentEditingId: string | null = null;
  isLoading = false;

  form = { level: null as number | null, name: '', scoreRange: '', description: '', actionsRequired: '' };
  levelDisabled = false;

  constructor(
    private paramsService: BusinessParamsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.paramsService.filterRiskCategories(this.searchTerm).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading risk categories:', error);
        this.notificationService.show('Failed to load risk categories', 'error');
        this.isLoading = false;
      }
    });
  }

  filter(): void {
    this.loadData();
  }

  openCreateModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add Risk Category';
    this.form = { level: null, name: '', scoreRange: '', description: '', actionsRequired: '' };
    this.levelDisabled = false;
    this.showModal = true;
  }

  editItem(id: string): void {
    this.paramsService.getRiskCategoryById(id).subscribe({
      next: (item) => {
        if (item) {
          this.currentEditingId = id;
          this.modalTitle = 'Edit Risk Category';
          this.form = {
            level: item.level, name: item.name, scoreRange: item.scoreRange,
            description: item.description || '', actionsRequired: item.actionsRequired || ''
          };
          this.levelDisabled = true;
          this.showModal = true;
        }
      },
      error: (error) => {
        console.error('Error loading risk category:', error);
        this.notificationService.show('Failed to load risk category', 'error');
      }
    });
  }

  save(): void {
    const level = this.form.level;
    const name = this.form.name.trim();
    const scoreRange = this.form.scoreRange.trim();
    if (!level || !name || !scoreRange) {
      this.notificationService.show('Please fill in all required fields', 'error');
      return;
    }

    const data = { level, name, scoreRange, description: this.form.description.trim(), actionsRequired: this.form.actionsRequired.trim() };

    if (this.currentEditingId) {
      this.paramsService.updateRiskCategory(this.currentEditingId, data).subscribe({
        next: () => {
          this.notificationService.show('Risk category updated successfully!', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating risk category:', error);
          this.notificationService.show('Failed to update risk category', 'error');
        }
      });
    } else {
      this.paramsService.createRiskCategory(data).subscribe({
        next: () => {
          this.notificationService.show('Risk category created successfully!', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating risk category:', error);
          this.notificationService.show('Failed to create risk category', 'error');
        }
      });
    }
  }

  deleteItem(id: string): void {
    const item = this.categories.find(c => c.id === id);
    if (item && confirm(`Are you sure you want to delete risk category "${item.name}"? This action cannot be undone.`)) {
      this.paramsService.deleteRiskCategory(id).subscribe({
        next: () => {
          this.notificationService.show('Risk category deleted successfully!', 'success');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting risk category:', error);
          this.notificationService.show('Failed to delete risk category', 'error');
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
