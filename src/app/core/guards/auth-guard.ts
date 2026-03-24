import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  // Inyectamos el servicio de auth y el router
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario está autenticado, lo dejamos pasar al dashboard
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si no está autenticado, lo pateamos a la pantalla de login
  router.navigate(['/auth/login']);
  return false;
};