import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { BusinessType } from '../../models/business-params.model';
import { BusinessParamsService } from '../../services/business-params.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-business-types',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './business-types.component.html',
  styleUrl: './business-types.component.css'
})
export class BusinessTypesComponent implements OnInit {
  businessTypes: BusinessType[] = [];
  searchTerm = '';
  statusFilter = '';
  showModal = false;
  modalTitle = 'Add Business Type';
  currentEditingId: string | null = null;
  isLoading = false;

  form = { code: '', name: '', description: '', status: 'active' as 'active' | 'inactive' };
  codeDisabled = false;

  // Validation errors
  codeError = '';
  nameError = '';
  descriptionError = '';

  // Touched flags
  codeTouched = false;
  nameTouched = false;
  descriptionTouched = false;

  constructor(
    private paramsService: BusinessParamsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.paramsService.filterBusinessTypes(this.searchTerm, this.statusFilter).subscribe({
      next: (types) => {
        this.businessTypes = types;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading business types:', error);
        this.notificationService.show('Failed to load business types', 'error');
        this.isLoading = false;
      }
    });
  }

  filter(): void {
    this.loadData();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.loadData();
  }

  openCreateModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add Business Type';
    this.form = { code: '', name: '', description: '', status: 'active' };
    this.codeDisabled = false;
    this.resetValidation();
    this.showModal = true;
  }

  editItem(id: string): void {
    this.paramsService.getBusinessTypeById(id).subscribe({
      next: (item) => {
        if (item) {
          this.currentEditingId = id;
          this.modalTitle = 'Edit Business Type';
          this.form = { code: item.code, name: item.name, description: item.description || '', status: item.status };
          this.codeDisabled = true;
          this.resetValidation();
          this.showModal = true;
        }
      },
      error: (error) => {
        console.error('Error loading business type:', error);
        this.notificationService.show('Failed to load business type', 'error');
      }
    });
  }

  save(): void {
    this.markAllTouched();
    this.validateCode();
    this.validateName();
    this.validateDescription();

    if (this.codeError || this.nameError || this.descriptionError) {
      this.notificationService.show('Please fix the errors before saving', 'error');
      return;
    }

    const code = this.form.code.trim().toUpperCase();
    const name = this.form.name.trim();

    const data = { code, name, description: this.form.description.trim(), status: this.form.status };

    if (this.currentEditingId) {
      this.paramsService.updateBusinessType(this.currentEditingId, data).subscribe({
        next: () => {
          this.notificationService.show('Business type updated successfully!', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating business type:', error);
          this.notificationService.show('Failed to update business type', 'error');
        }
      });
    } else {
      this.paramsService.createBusinessType(data).subscribe({
        next: () => {
          this.notificationService.show('Business type created successfully!', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating business type:', error);
          this.notificationService.show('Failed to create business type', 'error');
        }
      });
    }
  }

  deleteItem(id: string): void {
    const item = this.businessTypes.find(t => t.id === id);
    if (item && confirm(`Are you sure you want to delete business type "${item.name}"? This action cannot be undone.`)) {
      this.paramsService.deleteBusinessType(id).subscribe({
        next: () => {
          this.notificationService.show('Business type deleted successfully!', 'success');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting business type:', error);
          this.notificationService.show('Failed to delete business type', 'error');
        }
      });
    }
  }

  validateCode(): void {
    if (!this.codeTouched) return;
    this.codeError = this.form.code.trim() ? '' : 'Code is required';
  }

  validateName(): void {
    if (!this.nameTouched) return;
    this.nameError = this.form.name.trim() ? '' : 'Name is required';
  }

  validateDescription(): void {
    if (!this.descriptionTouched) return;
    this.descriptionError = this.form.description.trim() ? '' : 'Description is required';
  }

  markAllTouched(): void {
    this.codeTouched = true;
    this.nameTouched = true;
    this.descriptionTouched = true;
  }

  get hasFormErrors(): boolean {
    return !this.form.code.trim()
      || !this.form.name.trim()
      || !this.form.description.trim()
      || !!this.codeError
      || !!this.nameError
      || !!this.descriptionError;
  }

  resetValidation(): void {
    this.codeError = '';
    this.nameError = '';
    this.descriptionError = '';
    this.codeTouched = false;
    this.nameTouched = false;
    this.descriptionTouched = false;
  }

  closeModal(): void {
    this.showModal = false;
  }

  formatDate(dateString: string): string {
    return this.paramsService.formatDate(dateString);
  }
}
