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

  form = { code: '', name: '', description: '', status: 'active' as 'active' | 'inactive' };
  codeDisabled = false;

  constructor(
    private paramsService: BusinessParamsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.businessTypes = this.paramsService.filterBusinessTypes(this.searchTerm, this.statusFilter);
  }

  filter(): void {
    this.loadData();
  }

  openCreateModal(): void {
    this.currentEditingId = null;
    this.modalTitle = 'Add Business Type';
    this.form = { code: '', name: '', description: '', status: 'active' };
    this.codeDisabled = false;
    this.showModal = true;
  }

  editItem(id: string): void {
    const item = this.paramsService.getBusinessTypeById(id);
    if (item) {
      this.currentEditingId = id;
      this.modalTitle = 'Edit Business Type';
      this.form = { code: item.code, name: item.name, description: item.description, status: item.status };
      this.codeDisabled = true;
      this.showModal = true;
    }
  }

  save(): void {
    const code = this.form.code.trim().toUpperCase();
    const name = this.form.name.trim();
    if (!code || !name) {
      this.notificationService.show('Please fill in all required fields', 'error');
      return;
    }
    const result = this.paramsService.saveBusinessType(
      { code, name, description: this.form.description.trim(), status: this.form.status },
      this.currentEditingId
    );
    this.notificationService.show(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      this.closeModal();
      this.loadData();
    }
  }

  deleteItem(id: string): void {
    const item = this.paramsService.getBusinessTypeById(id);
    if (item && confirm(`Are you sure you want to delete business type "${item.name}"? This action cannot be undone.`)) {
      this.paramsService.deleteBusinessType(id);
      this.notificationService.show('Business type deleted successfully!', 'success');
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
