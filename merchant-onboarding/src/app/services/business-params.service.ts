import { Injectable } from '@angular/core';
import { BusinessType, MerchantCategory, RiskCategory } from '../models/business-params.model';

@Injectable({
  providedIn: 'root'
})
export class BusinessParamsService {
  private readonly BT_KEY = 'businessTypes';
  private readonly MC_KEY = 'merchantCategories';
  private readonly RC_KEY = 'riskCategories';

  private defaultBusinessTypes: BusinessType[] = [
    { id: 'bt1', code: 'SP', name: 'Sole Proprietorship', description: 'Individual business ownership', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'bt2', code: 'PT', name: 'Partnership', description: 'Business partnership between two or more individuals', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'bt3', code: 'SB', name: 'Sdn Bhd', description: 'Private limited company', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'bt4', code: 'BHD', name: 'Bhd', description: 'Public limited company', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' }
  ];

  private defaultMerchantCategories: MerchantCategory[] = [
    { id: 'mc1', code: 'RET', name: 'Retail', description: 'Physical retail stores and outlets', riskLevel: 'low', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'mc2', code: 'ECM', name: 'E-commerce', description: 'Online retail and digital commerce', riskLevel: 'medium', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'mc3', code: 'F&B', name: 'Food & Beverage', description: 'Restaurants, cafes, and food services', riskLevel: 'low', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'mc4', code: 'SRV', name: 'Services', description: 'Professional and business services', riskLevel: 'medium', status: 'active', createdAt: '2024-01-01T00:00:00.000Z' }
  ];

  private defaultRiskCategories: RiskCategory[] = [
    { id: 'rc1', level: 1, name: 'Low Risk', scoreRange: '0-30', description: 'Minimal risk requiring standard verification', actionsRequired: 'Standard document verification and basic due diligence', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'rc2', level: 2, name: 'Medium Risk', scoreRange: '31-70', description: 'Moderate risk requiring enhanced verification', actionsRequired: 'Enhanced due diligence, additional documentation, senior approval required', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'rc3', level: 3, name: 'High Risk', scoreRange: '71-100', description: 'High risk requiring comprehensive assessment', actionsRequired: 'Comprehensive due diligence, management approval, ongoing monitoring', createdAt: '2024-01-01T00:00:00.000Z' }
  ];

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    if (!localStorage.getItem(this.BT_KEY)) {
      localStorage.setItem(this.BT_KEY, JSON.stringify(this.defaultBusinessTypes));
    }
    if (!localStorage.getItem(this.MC_KEY)) {
      localStorage.setItem(this.MC_KEY, JSON.stringify(this.defaultMerchantCategories));
    }
    if (!localStorage.getItem(this.RC_KEY)) {
      localStorage.setItem(this.RC_KEY, JSON.stringify(this.defaultRiskCategories));
    }
  }

  // ─── Business Types ───────────────────────────────────────

  getAllBusinessTypes(): BusinessType[] {
    return JSON.parse(localStorage.getItem(this.BT_KEY) || '[]');
  }

  filterBusinessTypes(search: string, status: string): BusinessType[] {
    let items = this.getAllBusinessTypes();
    if (status) {
      items = items.filter(t => t.status === status);
    }
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(t =>
        t.code.toLowerCase().includes(term) ||
        t.name.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    }
    return items;
  }

  saveBusinessType(data: Partial<BusinessType>, editingId: string | null): { success: boolean; message: string } {
    const items = this.getAllBusinessTypes();
    if (editingId) {
      const index = items.findIndex(t => t.id === editingId);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(this.BT_KEY, JSON.stringify(items));
        return { success: true, message: 'Business type updated successfully!' };
      }
    } else {
      if (items.find(t => t.code === data.code)) {
        return { success: false, message: 'Business type code already exists' };
      }
      items.push({
        id: 'bt_' + Date.now(),
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        status: (data.status as 'active' | 'inactive') || 'active',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(this.BT_KEY, JSON.stringify(items));
      return { success: true, message: 'Business type created successfully!' };
    }
    return { success: false, message: 'Failed to save business type' };
  }

  deleteBusinessType(id: string): void {
    const items = this.getAllBusinessTypes().filter(t => t.id !== id);
    localStorage.setItem(this.BT_KEY, JSON.stringify(items));
  }

  getBusinessTypeById(id: string): BusinessType | undefined {
    return this.getAllBusinessTypes().find(t => t.id === id);
  }

  // ─── Merchant Categories ──────────────────────────────────

  getAllMerchantCategories(): MerchantCategory[] {
    return JSON.parse(localStorage.getItem(this.MC_KEY) || '[]');
  }

  filterMerchantCategories(search: string, status: string, riskLevel: string): MerchantCategory[] {
    let items = this.getAllMerchantCategories();
    if (status) {
      items = items.filter(c => c.status === status);
    }
    if (riskLevel) {
      items = items.filter(c => c.riskLevel === riskLevel);
    }
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(c =>
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    }
    return items;
  }

  saveMerchantCategory(data: Partial<MerchantCategory>, editingId: string | null): { success: boolean; message: string } {
    const items = this.getAllMerchantCategories();
    if (editingId) {
      const index = items.findIndex(c => c.id === editingId);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(this.MC_KEY, JSON.stringify(items));
        return { success: true, message: 'Merchant category updated successfully!' };
      }
    } else {
      if (items.find(c => c.code === data.code)) {
        return { success: false, message: 'Merchant category code already exists' };
      }
      items.push({
        id: 'mc_' + Date.now(),
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        riskLevel: (data.riskLevel as 'low' | 'medium' | 'high') || 'low',
        status: (data.status as 'active' | 'inactive') || 'active',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(this.MC_KEY, JSON.stringify(items));
      return { success: true, message: 'Merchant category created successfully!' };
    }
    return { success: false, message: 'Failed to save merchant category' };
  }

  deleteMerchantCategory(id: string): void {
    const items = this.getAllMerchantCategories().filter(c => c.id !== id);
    localStorage.setItem(this.MC_KEY, JSON.stringify(items));
  }

  getMerchantCategoryById(id: string): MerchantCategory | undefined {
    return this.getAllMerchantCategories().find(c => c.id === id);
  }

  // ─── Risk Categories ──────────────────────────────────────

  getAllRiskCategories(): RiskCategory[] {
    return JSON.parse(localStorage.getItem(this.RC_KEY) || '[]');
  }

  filterRiskCategories(search: string): RiskCategory[] {
    let items = this.getAllRiskCategories();
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(c =>
        c.level.toString().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.scoreRange.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    }
    return items.sort((a, b) => a.level - b.level);
  }

  saveRiskCategory(data: Partial<RiskCategory>, editingId: string | null): { success: boolean; message: string } {
    const items = this.getAllRiskCategories();
    if (editingId) {
      const index = items.findIndex(c => c.id === editingId);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(this.RC_KEY, JSON.stringify(items));
        return { success: true, message: 'Risk category updated successfully!' };
      }
    } else {
      if (items.find(c => c.level === data.level)) {
        return { success: false, message: 'Risk category level already exists' };
      }
      items.push({
        id: 'rc_' + Date.now(),
        level: data.level || 0,
        name: data.name || '',
        scoreRange: data.scoreRange || '',
        description: data.description || '',
        actionsRequired: data.actionsRequired || '',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(this.RC_KEY, JSON.stringify(items));
      return { success: true, message: 'Risk category created successfully!' };
    }
    return { success: false, message: 'Failed to save risk category' };
  }

  deleteRiskCategory(id: string): void {
    const items = this.getAllRiskCategories().filter(c => c.id !== id);
    localStorage.setItem(this.RC_KEY, JSON.stringify(items));
  }

  getRiskCategoryById(id: string): RiskCategory | undefined {
    return this.getAllRiskCategories().find(c => c.id === id);
  }

  // ─── Utility ──────────────────────────────────────────────

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY');
  }
}
