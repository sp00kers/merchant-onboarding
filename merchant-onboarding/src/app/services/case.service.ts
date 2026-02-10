import { Injectable } from '@angular/core';
import { Case, RoleBanner } from '../models/case.model';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private readonly CASES_KEY = 'cases';

  private defaultCases: Case[] = [
    {
      caseId: 'MOP-2024-001',
      businessName: 'ABC Electronics Sdn Bhd',
      businessType: 'Sdn Bhd',
      registrationNumber: '201801012345',
      merchantCategory: 'Retail',
      businessAddress: '123 Technology Park, Cyberjaya, Selangor, Malaysia',
      directorName: 'Ahmad bin Abdullah',
      directorIC: '850123-14-5678',
      directorPhone: '+60123456789',
      directorEmail: 'ahmad@abcelectronics.com',
      status: 'Pending Review',
      createdDate: '2024-01-15',
      assignedTo: 'John Doe',
      priority: 'Normal',
      lastUpdated: '2024-01-15 14:20',
      documents: [
        { name: 'Business Registration Certificate', type: 'pdf' },
        { name: 'Director ID Copy', type: 'pdf' },
        { name: 'Financial Statement', type: 'pdf' }
      ],
      history: [
        { time: '2024-01-15 10:30', action: 'Case created by John Doe' },
        { time: '2024-01-15 10:35', action: 'Assigned to Compliance Team' },
        { time: '2024-01-15 14:20', action: 'Documents uploaded' },
        { time: '2024-01-15 15:45', action: 'Initial review completed' }
      ]
    },
    {
      caseId: 'MOP-2024-002',
      businessName: 'XYZ Trading',
      businessType: 'Partnership',
      registrationNumber: '201901054321',
      merchantCategory: 'E-commerce',
      businessAddress: '456 Business Park, Kuala Lumpur, Malaysia',
      directorName: 'Lim Wei Chen',
      directorIC: '880512-10-1234',
      directorPhone: '+60198765432',
      directorEmail: 'lim@xyztrading.com',
      status: 'Background Verification',
      createdDate: '2024-01-14',
      assignedTo: 'Jane Smith',
      priority: 'Normal',
      lastUpdated: '2024-01-14 16:00',
      documents: [
        { name: 'Business Registration Certificate', type: 'pdf' },
        { name: 'Director ID Copy', type: 'pdf' }
      ],
      history: [
        { time: '2024-01-14 09:00', action: 'Case created by Jane Smith' },
        { time: '2024-01-14 16:00', action: 'Sent for background verification' }
      ]
    },
    {
      caseId: 'MOP-2024-003',
      businessName: 'Tech Solutions Ltd',
      businessType: 'Bhd',
      registrationNumber: '201701098765',
      merchantCategory: 'Services',
      businessAddress: '789 Innovation Hub, Penang, Malaysia',
      directorName: 'Raj Kumar',
      directorIC: '790815-07-9876',
      directorPhone: '+60171234567',
      directorEmail: 'raj@techsolutions.com',
      status: 'Approved',
      createdDate: '2024-01-13',
      assignedTo: 'Mike Johnson',
      priority: 'Normal',
      lastUpdated: '2024-01-13 11:30',
      documents: [
        { name: 'Business Registration Certificate', type: 'pdf' },
        { name: 'Director ID Copy', type: 'pdf' },
        { name: 'Financial Statement', type: 'pdf' }
      ],
      history: [
        { time: '2024-01-13 08:00', action: 'Case created by Mike Johnson' },
        { time: '2024-01-13 11:30', action: 'Case approved' }
      ]
    },
    {
      caseId: 'MOP-2024-004',
      businessName: 'Digital Marketing Co',
      businessType: 'Sdn Bhd',
      registrationNumber: '202001067890',
      merchantCategory: 'Services',
      businessAddress: '321 Digital Avenue, Johor Bahru, Malaysia',
      directorName: 'Siti Aminah',
      directorIC: '910303-01-5432',
      directorPhone: '+60131234567',
      directorEmail: 'siti@digitalmarketing.com',
      status: 'Rejected',
      createdDate: '2024-01-12',
      assignedTo: 'Sarah Lee',
      priority: 'Normal',
      lastUpdated: '2024-01-12 15:00',
      documents: [
        { name: 'Business Registration Certificate', type: 'pdf' }
      ],
      history: [
        { time: '2024-01-12 10:00', action: 'Case created by Sarah Lee' },
        { time: '2024-01-12 15:00', action: 'Case rejected - incomplete documents' }
      ]
    },
    {
      caseId: 'MOP-2024-005',
      businessName: 'Green Energy Solutions',
      businessType: 'Sdn Bhd',
      registrationNumber: '202201034567',
      merchantCategory: 'Retail',
      businessAddress: '555 Green Park, Shah Alam, Selangor, Malaysia',
      directorName: 'David Chen',
      directorIC: '850701-14-7890',
      directorPhone: '+60141234567',
      directorEmail: 'david@greenenergy.com',
      status: 'Compliance Review',
      createdDate: '2024-01-11',
      assignedTo: 'David Chen',
      priority: 'Normal',
      lastUpdated: '2024-01-11 14:00',
      documents: [
        { name: 'Business Registration Certificate', type: 'pdf' },
        { name: 'Director ID Copy', type: 'pdf' },
        { name: 'Financial Statement', type: 'pdf' },
        { name: 'Bank Statement', type: 'pdf' }
      ],
      history: [
        { time: '2024-01-11 09:00', action: 'Case created by David Chen' },
        { time: '2024-01-11 14:00', action: 'Sent for compliance review' }
      ]
    }
  ];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    if (!localStorage.getItem(this.CASES_KEY)) {
      localStorage.setItem(this.CASES_KEY, JSON.stringify(this.defaultCases));
    }
  }

  getAllCases(): Case[] {
    return JSON.parse(localStorage.getItem(this.CASES_KEY) || '[]');
  }

  getCaseById(caseId: string): Case | undefined {
    return this.getAllCases().find(c => c.caseId === caseId);
  }

  filterCases(status: string, search: string): Case[] {
    let cases = this.getAllCases();
    if (status) {
      cases = cases.filter(c => c.status.toLowerCase().replace(/\s+/g, '_') === status);
    }
    if (search) {
      const term = search.toLowerCase();
      cases = cases.filter(c =>
        c.businessName.toLowerCase().includes(term) ||
        c.caseId.toLowerCase().includes(term)
      );
    }
    return cases;
  }

  createCase(caseData: Partial<Case>): Case {
    const cases = this.getAllCases();
    const newCase: Case = {
      caseId: 'MOP-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-3),
      businessName: caseData.businessName || '',
      businessType: caseData.businessType || '',
      registrationNumber: caseData.registrationNumber || '',
      merchantCategory: caseData.merchantCategory || '',
      businessAddress: caseData.businessAddress || '',
      directorName: caseData.directorName || '',
      directorIC: caseData.directorIC || '',
      directorPhone: caseData.directorPhone || '',
      directorEmail: caseData.directorEmail || '',
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
      assignedTo: 'Unassigned',
      priority: 'Normal',
      lastUpdated: new Date().toLocaleString(),
      documents: [],
      history: [
        { time: new Date().toLocaleString(), action: 'Case created' }
      ]
    };
    cases.push(newCase);
    localStorage.setItem(this.CASES_KEY, JSON.stringify(cases));
    return newCase;
  }

  addHistoryItem(caseId: string, action: string): void {
    const cases = this.getAllCases();
    const caseItem = cases.find(c => c.caseId === caseId);
    if (caseItem) {
      caseItem.history.unshift({
        time: new Date().toLocaleString(),
        action
      });
      caseItem.lastUpdated = new Date().toLocaleString();
      localStorage.setItem(this.CASES_KEY, JSON.stringify(cases));
    }
  }

  updateCaseStatus(caseId: string, status: string): void {
    const cases = this.getAllCases();
    const caseItem = cases.find(c => c.caseId === caseId);
    if (caseItem) {
      caseItem.status = status;
      caseItem.lastUpdated = new Date().toLocaleString();
      localStorage.setItem(this.CASES_KEY, JSON.stringify(cases));
    }
  }

  getRoleBanner(roleId: string, context: 'list' | 'detail'): RoleBanner | null {
    const banners: Record<string, Record<string, RoleBanner>> = {
      onboarding_officer: {
        list: {
          icon: '👁️',
          title: 'Onboarding Officer Mode',
          message: 'You can view all cases and create new ones. Click "View" to review case details and take actions where permitted.',
          bannerClass: 'info-banner'
        },
        detail: {
          icon: 'ℹ️',
          title: 'Onboarding Officer Access',
          message: 'You can view case details and add comments. For approvals or rejections, please contact a Compliance Reviewer.',
          bannerClass: 'info-banner'
        }
      },
      compliance_reviewer: {
        list: {
          icon: '✏️',
          title: 'Compliance Reviewer Mode',
          message: 'You can view and manage all cases. Click "View" to review case details and approve, reject, or request more information.',
          bannerClass: 'success-banner'
        },
        detail: {
          icon: '✏️',
          title: 'Compliance Reviewer Access',
          message: 'You can view, approve, reject, or request more information for this case. You have full control over the compliance review process.',
          bannerClass: 'success-banner'
        }
      },
      verifier: {
        list: {
          icon: '🔍',
          title: 'Verifier Mode',
          message: 'You can view cases for verification purposes. Click "View" to review case details and perform background verification tasks.',
          bannerClass: 'warning-banner'
        },
        detail: {
          icon: '🔍',
          title: 'Verifier Access',
          message: 'You can view case details and perform background verification tasks. Contact Compliance Reviewers for case status changes.',
          bannerClass: 'warning-banner'
        }
      },
      admin: {
        list: {
          icon: '⚙️',
          title: 'Administrator Mode',
          message: 'You have full system access. Click "View" to review case details and perform all available actions.',
          bannerClass: 'admin-banner'
        },
        detail: {
          icon: '⚙️',
          title: 'Administrator Access',
          message: 'You have full access to all case functions including approval, rejection, and case management.',
          bannerClass: 'admin-banner'
        }
      }
    };

    return banners[roleId]?.[context] || null;
  }
}
