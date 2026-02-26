import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { AccountManagementComponent } from './pages/account-management/account-management.component';
import { BusinessParamsComponent } from './pages/business-params/business-params.component';
import { BusinessTypesComponent } from './pages/business-types/business-types.component';
import { CaseDetailsComponent } from './pages/case-details/case-details.component';
import { CasesComponent } from './pages/cases/cases.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { MerchantCategoriesComponent } from './pages/merchant-categories/merchant-categories.component';
import { PermissionManagementComponent } from './pages/permission-management/permission-management.component';
import { RiskCategoriesComponent } from './pages/risk-categories/risk-categories.component';
import { RoleManagementComponent } from './pages/role-management/role-management.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Dashboard — any authenticated user
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  // Cases — require case-related permissions
  { path: 'cases', component: CasesComponent, canActivate: [authGuard, roleGuard(['case_view', 'case_management', 'case_creation', 'all_modules'])] },
  { path: 'cases/:id', component: CaseDetailsComponent, canActivate: [authGuard, roleGuard(['case_view', 'case_management', 'case_creation', 'all_modules'])] },

  // Business Parameters — require system_configuration or all_modules
  { path: 'business-params', component: BusinessParamsComponent, canActivate: [authGuard, roleGuard(['system_configuration', 'all_modules'])] },
  { path: 'business-params/business-types', component: BusinessTypesComponent, canActivate: [authGuard, roleGuard(['system_configuration', 'all_modules'])] },
  { path: 'business-params/merchant-categories', component: MerchantCategoriesComponent, canActivate: [authGuard, roleGuard(['system_configuration', 'all_modules'])] },
  { path: 'business-params/risk-categories', component: RiskCategoriesComponent, canActivate: [authGuard, roleGuard(['system_configuration', 'all_modules'])] },

  // Account Management — require user_management, role_management, permission_management, or all_modules
  { path: 'account-management', component: AccountManagementComponent, canActivate: [authGuard, roleGuard(['user_management', 'role_management', 'permission_management', 'all_modules'])] },
  { path: 'account-management/user-management', component: UserManagementComponent, canActivate: [authGuard, roleGuard(['user_management', 'all_modules'])] },
  { path: 'account-management/role-management', component: RoleManagementComponent, canActivate: [authGuard, roleGuard(['role_management', 'all_modules'])] },
  { path: 'account-management/permission-management', component: PermissionManagementComponent, canActivate: [authGuard, roleGuard(['permission_management', 'all_modules'])] },

  { path: '**', redirectTo: 'login' }
];
