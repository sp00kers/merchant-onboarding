export interface Case {
  caseId: string;
  businessName: string;
  businessType: string;
  registrationNumber: string;
  merchantCategory: string;
  businessAddress: string;
  directorName: string;
  directorIC: string;
  directorPhone: string;
  directorEmail: string;
  status: string;
  createdDate: string;
  assignedTo: string;
  priority: string;
  lastUpdated: string;
  documents: CaseDocument[];
  history: CaseHistoryItem[];
}

export interface CaseDocument {
  name: string;
  type: string;
  uploadedAt?: string;
}

export interface CaseHistoryItem {
  time: string;
  action: string;
}

export interface RoleBanner {
  icon: string;
  title: string;
  message: string;
  bannerClass: string;
}
