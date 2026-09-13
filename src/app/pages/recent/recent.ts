import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { MagneticDirective } from '../../components/ui/magnetic.directive';
import { RevealDirective } from '../../components/ui/reveal.directive';
import { TiltDirective } from '../../components/ui/tilt.directive';
import { APP_ROUTES } from '../../core/constants/app.constants';
import { RecipeStats } from '../../core/interfaces/recipe.interface';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-recent',
  imports: [RouterLink, ConfirmDialogComponent, RevealDirective, TiltDirective, MagneticDirective],
  templateUrl: './recent.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentComponent {
  private readonly router = inject(Router);
  private readonly stateService = inject(RecipeStateService);
  private readonly apiService = inject(RecipeApiService);
  private readonly toastService = inject(ToastService);

  protected readonly routes = APP_ROUTES;
  protected readonly recipes = this.stateService.recentRecipes;
  protected readonly hasMore = this.stateService.hasMoreRecent;

  protected readonly isLoading = signal<boolean>(true);
  protected readonly isLoadingMore = signal<boolean>(false);
  protected readonly stats = signal<RecipeStats | null>(null);
  protected readonly query = signal<string>('');

  protected readonly deletingId = signal<string | null>(null);
  protected readonly pendingDeleteId = signal<string | null>(null);
  protected readonly isClearConfirmOpen = signal<boolean>(false);
  protected readonly isClearing = signal<boolean>(false);

  // Filters the loaded page(s) by title or any ingredient name.
  protected readonly filteredRecipes = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.recipes();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((ing) => ing.name.toLowerCase().includes(q)),
    );
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.stateService.loadRecentRecipes(),
        this.apiService.fetchRecipeStats().then((s) => this.stats.set(s)),
      ]);
    } catch (err: unknown) {
      this.toastService.error(getErrorMessage(err, 'Could not load your recent recipes.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async loadMore(): Promise<void> {
    if (this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    try {
      await this.stateService.loadMoreRecent();
    } catch (err: unknown) {
      this.toastService.error(getErrorMessage(err, 'Could not load more recipes.'));
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected openRecipe(id: string): void {
    this.router.navigate(this.routes.recipeIngredients(id));
  }

  protected requestDelete(id: string): void {
    this.pendingDeleteId.set(id);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const id = this.pendingDeleteId();
    if (!id) return;
    this.pendingDeleteId.set(null);
    this.deletingId.set(id);
    try {
      await this.stateService.removeRecentRecipe(id);
      this.stats.update((s) => (s ? { ...s, totalRecipes: Math.max(0, s.totalRecipes - 1) } : s));
      this.toastService.success('Recipe removed.');
    } catch (err: unknown) {
      this.toastService.error(getErrorMessage(err, 'Could not delete that recipe.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  protected requestClear(): void {
    this.isClearConfirmOpen.set(true);
  }

  protected cancelClear(): void {
    this.isClearConfirmOpen.set(false);
  }

  protected async confirmClear(): Promise<void> {
    this.isClearConfirmOpen.set(false);
    this.isClearing.set(true);
    try {
      await this.stateService.clearAllRecent();
      this.stats.set({ totalRecipes: 0, totalMinutes: 0, distinctCuisines: 0 });
      this.toastService.success('History cleared.');
    } catch (err: unknown) {
      this.toastService.error(getErrorMessage(err, 'Could not clear your history.'));
    } finally {
      this.isClearing.set(false);
    }
  }
}
