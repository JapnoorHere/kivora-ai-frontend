import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MagneticDirective } from '../ui/magnetic.directive';
import { APP_ROUTES, MOBILE_BREAKPOINT_PX } from '../../core/constants/app.constants';
import { AuthService } from '../../core/services/auth.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { BugReportModalComponent } from '../bug-report-modal/bug-report-modal';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-dock',
  imports: [RouterLink, RouterLinkActive, ConfirmDialogComponent, BugReportModalComponent, MagneticDirective],
  templateUrl: './dock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:resize)': 'onResize()' },
})
export class DockComponent {
  private readonly authService = inject(AuthService);
  private readonly recipeState = inject(RecipeStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // Exposed for [routerLink] bindings to the id-based recipe routes in the template
  protected readonly routes = APP_ROUTES;

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentRecipe = this.recipeState.currentRecipe;
  protected readonly isLogoutConfirmOpen = signal<boolean>(false);
  protected readonly isFeedbackOpen = signal<boolean>(false);
  protected readonly isAccountMenuOpen = signal<boolean>(false);
  protected readonly isMobileView = signal<boolean>(window.innerWidth < MOBILE_BREAKPOINT_PX);

  protected onResize(): void {
    this.isMobileView.set(window.innerWidth < MOBILE_BREAKPOINT_PX);
  }

  protected toggleAccountMenu(): void {
    this.isAccountMenuOpen.update(v => !v);
  }

  protected closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

  protected onAccountButtonClick(): void {
    if (this.isAuthenticated()) {
      this.toggleAccountMenu();
    } else {
      this.redirectToLogin();
    }
  }

  protected triggerLogoutConfirm(): void {
    this.isAccountMenuOpen.set(false);
    this.isLogoutConfirmOpen.set(true);
  }

  protected cancelLogout(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  protected async confirmLogout(): Promise<void> {
    this.isLogoutConfirmOpen.set(false);
    await this.authService.logout();
    this.toast.success('See you next time, Chef!', 'Signed Out');
    this.router.navigate([APP_ROUTES.HOME]);
  }

  protected redirectToLogin(): void {
    this.authService.promptLogin();
  }

  protected newRecipe(): void {
    this.router.navigate([APP_ROUTES.HOME]);
  }
}
