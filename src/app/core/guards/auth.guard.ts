import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { APP_ROUTES } from '../constants/app.constants';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state: RouterStateSnapshot): Promise<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.checkSession();

  if (authService.isAuthenticated()) {
    return true;
  }

  // Carry the blocked destination so signing in resumes it rather than dumping
  // the visitor on the home page.
  router.navigate([APP_ROUTES.LOGIN], { queryParams: { returnUrl: state.url } });
  return false;
};
