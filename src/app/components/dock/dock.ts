import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { BugReportModal } from '../bug-report-modal/bug-report-modal';

@Component({
  selector: 'app-dock',
  imports: [RouterLink, RouterLinkActive, ConfirmDialogComponent, BugReportModal],
  templateUrl: './dock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockComponent {
  private readonly authService = inject(AuthService);
  private readonly recipeState = inject(RecipeStateService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentRecipe = this.recipeState.currentRecipe;
  protected readonly isLogoutConfirmOpen = signal<boolean>(false);
  protected readonly isCollapsed = signal<boolean>(false);
  protected readonly isFeedbackOpen = signal<boolean>(false);

  protected toggleDock(): void {
    this.isCollapsed.update(v => !v);
  }

  protected triggerLogoutConfirm(): void {
    this.isLogoutConfirmOpen.set(true);
  }

  protected cancelLogout(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  protected async confirmLogout(): Promise<void> {
    this.isLogoutConfirmOpen.set(false);
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  protected redirectToLogin(): void {
    this.authService.isAuthModalOpen.set(true);
  }

  protected newRecipe(): void {
    this.router.navigate(['/']);
  }
}
