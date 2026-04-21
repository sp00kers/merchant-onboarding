import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Role-based route guard factory.
 * Refreshes user permissions from backend, then checks if the authenticated user
 * has any of the required permissions before allowing route access.
 * Redirects to dashboard with a message if not.
 *
 * @param requiredPermissions - Array of permission IDs (user needs at least one)
 */
export function roleGuard(requiredPermissions: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Must be logged in first
    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    // Refresh permissions from backend, then check access
    return authService.refreshCurrentUser().pipe(
      map(() => {
        if (authService.hasAnyPermission(requiredPermissions)) {
          return true;
        }

        // User lacks required permissions — redirect to dashboard
        router.navigate(['/dashboard'], {
          queryParams: { unauthorized: 'true' }
        });
        return false;
      })
    );
  };
}

