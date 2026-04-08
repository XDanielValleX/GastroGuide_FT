import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const creatorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const role = authService.currentUserValue?.role;
  if (role === 'CREATOR') {
    return true;
  }

  if (role === 'ADMIN') {
    router.navigate(['/dashboard/admin']);
  } else {
    router.navigate(['/dashboard/student']);
  }

  return false;
};
