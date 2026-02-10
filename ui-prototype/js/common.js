// Dynamic Role Management System
class RoleManager {
    constructor() {
        this.initializeDefaultData();
    }

    initializeDefaultData() {
        // Initialize default roles and permissions if not exists
        if (!localStorage.getItem('roles')) {
            const defaultRoles = [
                {
                    id: 'admin',
                    name: 'System Administrator',
                    description: 'Full system access and user management',
                    permissions: ['all_modules', 'user_management', 'system_configuration', 'role_management'],
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'onboarding_officer',
                    name: 'Onboarding Officer',
                    description: 'Create new merchant onboarding cases and view existing ones',
                    permissions: ['case_creation', 'case_view', 'document_upload'],
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'compliance_reviewer',
                    name: 'Compliance Reviewer',
                    description: 'Review and edit cases for regulatory compliance',
                    permissions: ['case_view', 'case_management', 'compliance_check', 'risk_assessment', 'document_upload'],
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'verifier',
                    name: 'Background Verifier',
                    description: 'Conduct background verification processes',
                    permissions: ['case_view', 'background_check', 'external_api_access', 'verification_reports'],
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('roles', JSON.stringify(defaultRoles));
        }

        if (!localStorage.getItem('permissions')) {
            const defaultPermissions = [
                { id: 'all_modules', name: 'All Modules', description: 'Access to all system modules' },
                { id: 'user_management', name: 'User Management', description: 'Manage system users' },
                { id: 'system_configuration', name: 'System Configuration', description: 'Configure system settings' },
                { id: 'role_management', name: 'Role Management', description: 'Manage roles and permissions' },
                { id: 'case_creation', name: 'Case Creation', description: 'Create new cases' },
                { id: 'case_view', name: 'Case View', description: 'View cases in read-only mode' },
                { id: 'case_management', name: 'Case Management', description: 'Edit and manage existing cases' },
                { id: 'document_upload', name: 'Document Upload', description: 'Upload case documents' },
                { id: 'compliance_check', name: 'Compliance Check', description: 'Perform compliance checks' },
                { id: 'risk_assessment', name: 'Risk Assessment', description: 'Conduct risk assessments' },
                { id: 'background_check', name: 'Background Check', description: 'Perform background verifications' },
                { id: 'external_api_access', name: 'External API Access', description: 'Access external APIs' },
                { id: 'verification_reports', name: 'Verification Reports', description: 'Generate verification reports' }
            ];
            localStorage.setItem('permissions', JSON.stringify(defaultPermissions));
        }

        // Force update existing roles to fix permission mismatch
        this.fixExistingRoles();
    }

    fixExistingRoles() {
        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        let updated = false;

        roles.forEach(role => {
            if (role.id === 'compliance_reviewer') {
                // Fix compliance reviewer permissions
                if (role.permissions.includes('case_review') && !role.permissions.includes('case_view')) {
                    role.permissions = role.permissions.filter(p => p !== 'case_review');
                    if (!role.permissions.includes('case_view')) {
                        role.permissions.push('case_view');
                    }
                    if (!role.permissions.includes('case_management')) {
                        role.permissions.push('case_management');
                    }
                    if (!role.permissions.includes('document_upload')) {
                        role.permissions.push('document_upload');
                    }
                    updated = true;
                }
            }
        });

        if (updated) {
            localStorage.setItem('roles', JSON.stringify(roles));
            console.log('Fixed compliance reviewer permissions');
        }
    }

    getAllRoles() {
        return JSON.parse(localStorage.getItem('roles') || '[]');
    }

    getActiveRoles() {
        return this.getAllRoles().filter(role => role.isActive);
    }

    getRoleById(roleId) {
        const roles = this.getAllRoles();
        return roles.find(role => role.id === roleId);
    }

    createRole(roleData) {
        const roles = this.getAllRoles();
        const newRole = {
            id: 'role_' + Date.now(),
            name: roleData.name,
            description: roleData.description || '',
            permissions: roleData.permissions || [],
            isActive: true,
            createdAt: new Date().toISOString()
        };
        roles.push(newRole);
        localStorage.setItem('roles', JSON.stringify(roles));
        return newRole;
    }

    updateRole(roleId, updates) {
        const roles = this.getAllRoles();
        const roleIndex = roles.findIndex(role => role.id === roleId);
        if (roleIndex !== -1) {
            roles[roleIndex] = { ...roles[roleIndex], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('roles', JSON.stringify(roles));
            return roles[roleIndex];
        }
        return null;
    }

    deleteRole(roleId) {
        const roles = this.getAllRoles();
        const filteredRoles = roles.filter(role => role.id !== roleId);
        localStorage.setItem('roles', JSON.stringify(filteredRoles));
    }

    getAllPermissions() {
        return JSON.parse(localStorage.getItem('permissions') || '[]');
    }

    userHasPermission(userRole, requiredPermission) {
        const role = this.getRoleById(userRole);
        if (!role) return false;
        
        // Admin role has all permissions
        if (role.permissions.includes('all_modules')) return true;
        
        return role.permissions.includes(requiredPermission);
    }

    // New method to check if user can view cases
    canViewCases(userRole) {
        return this.userHasPermission(userRole, 'case_view') || 
               this.userHasPermission(userRole, 'case_management') ||
               this.userHasPermission(userRole, 'all_modules');
    }

    // New method to check if user can edit cases
    canEditCases(userRole) {
        return this.userHasPermission(userRole, 'case_management') ||
               this.userHasPermission(userRole, 'all_modules');
    }
}

// Initialize role manager
const roleManager = new RoleManager();

// Common JavaScript functions
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    }
}

function updateNavigation() {
    const userRole = localStorage.getItem('userRole');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!userRole && window.location.pathname !== '/index.html') {
        window.location.href = 'index.html';
        return;
    }

    // Debug logging
    console.log('Current user role:', userRole);
    console.log('Can view cases:', roleManager.canViewCases(userRole));
    console.log('Can edit cases:', roleManager.canEditCases(userRole));
    
    // Show Cases link if user can view cases
    const casesLink = navMenu.querySelector('a[href="cases.html"]');
    if (casesLink) {
        if (roleManager.canViewCases(userRole)) {
            casesLink.style.display = '';
            console.log('Showing Cases link');
        } else {
            casesLink.style.display = 'none';
            console.log('Hiding Cases link');
        }
    }
    
    // Hide entire Account Management if user has no related permissions
    const accountManagementLink = navMenu.querySelector('a[href="account-management.html"]');
    if (accountManagementLink) {
        const hasUserManagement = roleManager.userHasPermission(userRole, 'user_management');
        const hasRoleManagement = roleManager.userHasPermission(userRole, 'role_management');
        
        if (!hasUserManagement && !hasRoleManagement) {
            accountManagementLink.style.display = 'none';
        } else {
            accountManagementLink.style.display = '';
        }
    }
    
    // Hide other menu items based on permissions
    const menuItems = [
        { element: 'a[href="business-params.html"]', permission: 'system_configuration' }
    ];

    menuItems.forEach(item => {
        const menuElement = navMenu.querySelector(item.element);
        if (menuElement) {
            if (roleManager.userHasPermission(userRole, item.permission)) {
                menuElement.style.display = '';
            } else {
                menuElement.style.display = 'none';
            }
        }
    });
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'index.html' && !localStorage.getItem('userRole')) {
        window.location.href = 'index.html';
    }
});

// Utility functions for formatting
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-MY');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 4px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);