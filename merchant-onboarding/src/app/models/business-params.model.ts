export interface BusinessType {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface MerchantCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface RiskCategory {
  id: string;
  level: number;
  name: string;
  scoreRange: string;
  description: string;
  actionsRequired: string;
  createdAt: string;
  updatedAt?: string;
}
