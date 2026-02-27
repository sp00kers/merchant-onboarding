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
  allCategories: RiskCategory[] = [];
  searchTerm = '';
  showModal = false;
  modalTitle = 'Add Risk Category';
  currentEditingId: string | null = null;
  isLoading = false;

  form = { level: null as number | null, name: '', scoreMin: null as number | null, scoreMax: null as number | null, description: '', actionsRequired: '' };
  levelDisabled = false;

  // Validation errors
  levelError = '';
  nameError = '';
  scoreRangeError = '';
  descriptionError = '';
  actionsRequiredError = '';

  // Touched flags
  levelTouched = false;
  nameTouched = false;
  scoreRangeTouched = false;
  descriptionTouched = false;
  actionsRequiredTouched = false;

  constructor(
    private paramsService: BusinessParamsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.paramsService.filterRiskCategories().subscribe({
      next: (categories) => {
        this.allCategories = categories;
        this.filter();
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
    if (!this.searchTerm) {
      this.categories = [...this.allCategories];
    } else {
      this.categories = this.allCategories.filter(cat =>
        cat.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filter();
  }

  openCreateModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add Risk Category';
    this.form = { level: null, name: '', scoreMin: null, scoreMax: null, description: '', actionsRequired: '' };
    this.levelDisabled = false;
    this.resetValidation();
    this.showModal = true;
  }

  editItem(id: string): void {
    this.paramsService.getRiskCategoryById(id).subscribe({
      next: (item) => {
        if (item) {
          this.currentEditingId = id;
          this.modalTitle = 'Edit Risk Category';
          const parts = (item.scoreRange || '').split('-');
          this.form = {
            level: item.level, name: item.name,
            scoreMin: parts.length >= 1 ? Number(parts[0]) : null,
            scoreMax: parts.length >= 2 ? Number(parts[1]) : null,
            description: item.description || '', actionsRequired: item.actionsRequired || ''
          };
          this.levelDisabled = true;
          this.resetValidation();
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
    this.markAllTouched();
    this.validateLevel();
    this.validateName();
    this.validateScoreRange();
    this.validateDescription();
    this.validateActionsRequired();

    if (this.levelError || this.nameError || this.scoreRangeError || this.descriptionError || this.actionsRequiredError) {
      this.notificationService.show('Please fix the errors before saving', 'error');
      return;
    }

    const level = this.form.level as number;
    const name = this.form.name.trim();
    const scoreRange = `${this.form.scoreMin}-${this.form.scoreMax}`;

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

  validateLevel(): void {
    if (!this.levelTouched) return;
    this.levelError = this.form.level ? '' : 'Level is required';
  }

  validateName(): void {
    if (!this.nameTouched) return;
    this.nameError = this.form.name.trim() ? '' : 'Name is required';
  }

  validateScoreRange(): void {
    if (!this.scoreRangeTouched) return;
    if (this.form.scoreMin === null || this.form.scoreMin === undefined) {
      this.scoreRangeError = 'Minimum score is required';
    } else if (this.form.scoreMax === null || this.form.scoreMax === undefined) {
      this.scoreRangeError = 'Maximum score is required';
    } else if (this.form.scoreMin > this.form.scoreMax) {
      this.scoreRangeError = 'Minimum score cannot be greater than maximum score';
    } else {
      this.scoreRangeError = '';
    }
  }

  validateDescription(): void {
    if (!this.descriptionTouched) return;
    this.descriptionError = this.form.description.trim() ? '' : 'Description is required';
  }

  validateActionsRequired(): void {
    if (!this.actionsRequiredTouched) return;
    this.actionsRequiredError = this.form.actionsRequired.trim() ? '' : 'Actions required is required';
  }

  markAllTouched(): void {
    this.levelTouched = true;
    this.nameTouched = true;
    this.scoreRangeTouched = true;
    this.descriptionTouched = true;
    this.actionsRequiredTouched = true;
  }

  get hasFormErrors(): boolean {
    return !this.form.level
      || !this.form.name.trim()
      || this.form.scoreMin === null || this.form.scoreMin === undefined
      || this.form.scoreMax === null || this.form.scoreMax === undefined
      || !this.form.description.trim()
      || !this.form.actionsRequired.trim()
      || !!this.levelError
      || !!this.nameError
      || !!this.scoreRangeError
      || !!this.descriptionError
      || !!this.actionsRequiredError;
  }

  resetValidation(): void {
    this.levelError = '';
    this.nameError = '';
    this.scoreRangeError = '';
    this.descriptionError = '';
    this.actionsRequiredError = '';
    this.levelTouched = false;
    this.nameTouched = false;
    this.scoreRangeTouched = false;
    this.descriptionTouched = false;
    this.actionsRequiredTouched = false;
  }

  closeModal(): void {
    this.showModal = false;
  }

  formatDate(dateString: string): string {
    return this.paramsService.formatDate(dateString);
  }
}
