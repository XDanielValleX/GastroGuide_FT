import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const role = authService.currentUserValue?.role;
  if (role === 'ADMIN') {
    return true;
  }

  if (role === 'CREATOR') {
    router.navigate(['/dashboard/creator']);
  } else {
    router.navigate(['/dashboard/student']);
  }

  return false;
};
