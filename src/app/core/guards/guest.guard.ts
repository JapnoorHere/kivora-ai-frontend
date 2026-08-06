import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APP_ROUTES } from '../constants/app.constants';
import { AuthService } from '../services/auth.service';

/** Keeps an already signed-in chef off the sign-in page. */
export const guestGuard: CanActivateFn = async (): Promise<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.checkSession();

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate([APP_ROUTES.HOME]);
  return false;
};
