import { Injectable } from '@angular/core';
import { User } from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly USERS_KEY = 'users';

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    if (!localStorage.getItem(this.USERS_KEY)) {
      const defaultUsers: User[] = [
        {
          id: 'USR001',
          name: 'John Doe',
          email: 'john.doe@bank.com',
          roleId: 'onboarding_officer',
          department: 'Merchant Services',
          phone: '+60123456789',
          status: 'active',
          lastLogin: '2024-01-15 09:30',
          createdAt: '2024-01-01',
          notes: 'Senior officer with 5 years experience'
        },
        {
          id: 'USR002',
          name: 'Jane Smith',
          email: 'jane.smith@bank.com',
          roleId: 'compliance_reviewer',
          department: 'Compliance',
          phone: '+60123456788',
          status: 'active',
          lastLogin: '2024-01-15 08:45',
          createdAt: '2024-01-02',
          notes: 'Compliance specialist'
        },
        {
          id: 'USR003',
          name: 'Mike Johnson',
          email: 'mike.johnson@bank.com',
          roleId: 'verifier',
          department: 'Risk Management',
          phone: '+60123456787',
          status: 'active',
          lastLogin: '2024-01-14 16:20',
          createdAt: '2024-01-03',
          notes: 'Background verification expert'
        },
        {
          id: 'USR004',
          name: 'Sarah Lee',
          email: 'sarah.lee@bank.com',
          roleId: 'admin',
          department: 'IT',
          phone: '+60123456786',
          status: 'active',
          lastLogin: '2024-01-15 10:00',
          createdAt: '2024-01-04',
          notes: 'System administrator'
        },
        {
          id: 'USR005',
          name: 'David Chen',
          email: 'david.chen@bank.com',
          roleId: 'onboarding_officer',
          department: 'Operations',
          phone: '+60123456785',
          status: 'inactive',
          lastLogin: '2024-01-10 14:30',
          createdAt: '2024-01-05',
          notes: 'On leave'
        }
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
    }
  }

  getAllUsers(): User[] {
    return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
  }

  getUserById(userId: string): User | undefined {
    return this.getAllUsers().find(u => u.id === userId);
  }

  createUser(userData: Partial<User>): User {
    const users = this.getAllUsers();
    const newUser: User = {
      id: 'USR' + String(Date.now()).slice(-3).padStart(3, '0'),
      name: userData.name || '',
      email: userData.email || '',
      roleId: userData.roleId || '',
      department: userData.department || '',
      phone: userData.phone,
      status: userData.status || 'active',
      lastLogin: 'Never',
      notes: userData.notes,
      customPermissions: userData.customPermissions,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return newUser;
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      return users[index];
    }
    return null;
  }

  deleteUser(userId: string): void {
    const users = this.getAllUsers().filter(u => u.id !== userId);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  toggleUserStatus(userId: string): User | null {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].status = users[index].status === 'active' ? 'inactive' : 'active';
      users[index].updatedAt = new Date().toISOString();
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      return users[index];
    }
    return null;
  }

  getActiveUsersCount(): number {
    return this.getAllUsers().filter(u => u.status === 'active').length;
  }
}
