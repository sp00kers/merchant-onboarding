import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = sessionStorage.getItem('authToken');

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest).pipe(
      tap({
        error: (error) => {
          if (error.status === 401 && !req.url.includes('/auth/login')) {
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('userRole');
            alert('Your session has expired. You have been logged in from another location.');
            router.navigate(['/login']);
          }
        }
      })
    );
  }

  return next(req);
};

