import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MagneticDirective } from '../../components/ui/magnetic.directive';
import { RevealDirective } from '../../components/ui/reveal.directive';
import { TiltDirective } from '../../components/ui/tilt.directive';
import { APP_ROUTES } from '../../core/constants/app.constants';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-recent',
  imports: [RouterLink, RevealDirective, TiltDirective, MagneticDirective],
  templateUrl: './recent.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentComponent {
  private readonly router = inject(Router);
  private readonly stateService = inject(RecipeStateService);
  private readonly toastService = inject(ToastService);

  protected readonly routes = APP_ROUTES;
  protected readonly recipes = this.stateService.recentRecipes;
  protected readonly isLoading = signal<boolean>(true);

  constructor() {
    this.loadRecipes();
  }

  private async loadRecipes(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.stateService.loadRecentRecipes();
    } catch (err: unknown) {
      this.toastService.error(getErrorMessage(err, 'Could not load your recent recipes.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected openRecipe(id: string): void {
    this.router.navigate(this.routes.recipeIngredients(id));
  }
}
