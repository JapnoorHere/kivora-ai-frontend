import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeModifyModalComponent } from '../../components/recipe-modify-modal/recipe-modify-modal';
import { APP_ROUTES } from '../../core/constants/app.constants';
import { LanguageCode } from '../../core/enums/recipe.enum';
import { Recipe } from '../../core/interfaces/recipe.interface';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-ingredients',
  imports: [RecipeModifyModalComponent],
  templateUrl: './ingredients.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsComponent {
  private readonly router = inject(Router);
  private readonly stateService = inject(RecipeStateService);
  private readonly apiService = inject(RecipeApiService);
  private readonly toastService = inject(ToastService);

  public readonly id = input.required<string>();

  protected readonly routes = APP_ROUTES;
  protected readonly recipe = signal<Recipe | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly checkedIngredients = signal<ReadonlySet<string>>(new Set());
  protected readonly isModifyOpen = signal<boolean>(false);
  protected readonly isSubmittingModification = signal<boolean>(false);

  constructor() {
    // Reruns whenever `id` changes — Angular reuses this component instance when
    // navigating between two recipe ids under the same route, so ngOnInit alone
    // would only fire once and leave the page showing stale data.
    effect(() => {
      this.loadRecipe(this.id());
    });
  }

  private async loadRecipe(id: string): Promise<void> {
    this.isLoading.set(true);
    this.checkedIngredients.set(new Set());
    try {
      const recipe = await this.stateService.resolveRecipe(id);
      this.recipe.set(recipe);
    } catch (err: unknown) {
      this.toastService.error(getErrorMessage(err, 'Could not load this recipe.'));
      await this.router.navigate([this.routes.HOME]);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected toggleIngredient(name: string): void {
    this.checkedIngredients.update((set) => {
      const next = new Set(set);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  protected isChecked(name: string): boolean {
    return this.checkedIngredients().has(name);
  }

  protected async goToSteps(): Promise<void> {
    const recipe = this.recipe();
    if (recipe) {
      await this.router.navigate(this.routes.recipeSteps(recipe.id));
    }
  }

  protected async onModify(modificationText: string): Promise<void> {
    await this.applyChange({ modificationText });
  }

  protected async onTranslate(targetLanguage: LanguageCode): Promise<void> {
    await this.applyChange({ targetLanguage });
  }

  private async applyChange(payload: { modificationText?: string; targetLanguage?: LanguageCode }): Promise<void> {
    const current = this.recipe();
    if (!current) return;

    this.isSubmittingModification.set(true);
    try {
      const updated = await this.apiService.modifyRecipe(current.id, payload);
      this.stateService.setRecipe(updated);
      this.isModifyOpen.set(false);
      this.toastService.success('Recipe updated. Enjoy!');
      await this.router.navigate(this.routes.recipeIngredients(updated.id));
    } catch (err: unknown) {
      this.toastService.error(getErrorMessage(err, 'Could not update this recipe. Please try again.'));
    } finally {
      this.isSubmittingModification.set(false);
    }
  }
}
