import { Component, ChangeDetectionStrategy, inject, signal, computed, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { LanguageSelector } from '../language-selector/language-selector';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LanguageSelector, ConfirmDialogComponent],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly recipeState = inject(RecipeStateService);
  private readonly router = inject(Router);

  // Modern input signal to check if rendered inside the mobile overlay drawer
  public readonly isMobile = input<boolean>(false);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentRecipe = this.recipeState.currentRecipe;

  // Desktop collapse state (defaults to collapsed)
  protected readonly isCollapsed = signal<boolean>(true);

  // Logout confirmation modal state
  protected readonly isLogoutConfirmOpen = signal<boolean>(false);

  // Computed state for UI logic
  protected readonly effectiveCollapsed = computed(() => {
    return this.isMobile() ? false : this.isCollapsed();
  });

  protected toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
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
    this.router.navigate(['/login']);
  }
}
