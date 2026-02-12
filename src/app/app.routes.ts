import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
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
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'cases', component: CasesComponent, canActivate: [authGuard] },
  { path: 'cases/:id', component: CaseDetailsComponent, canActivate: [authGuard] },
  { path: 'business-params', component: BusinessParamsComponent, canActivate: [authGuard] },
  { path: 'business-params/business-types', component: BusinessTypesComponent, canActivate: [authGuard] },
  { path: 'business-params/merchant-categories', component: MerchantCategoriesComponent, canActivate: [authGuard] },
  { path: 'business-params/risk-categories', component: RiskCategoriesComponent, canActivate: [authGuard] },
  { path: 'account-management', component: AccountManagementComponent, canActivate: [authGuard] },
  { path: 'account-management/user-management', component: UserManagementComponent, canActivate: [authGuard] },
  { path: 'account-management/role-management', component: RoleManagementComponent, canActivate: [authGuard] },
  { path: 'account-management/permission-management', component: PermissionManagementComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
