import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeModifyModalComponent } from '../../components/recipe-modify-modal/recipe-modify-modal';
import { IngredientThumbComponent } from '../../components/ui/ingredient-thumb/ingredient-thumb';
import { MagneticDirective } from '../../components/ui/magnetic.directive';
import { PexelsCreditComponent } from '../../components/ui/pexels-credit/pexels-credit';
import { RecipeHeroPhotoComponent } from '../../components/ui/recipe-hero-photo/recipe-hero-photo';
import { RevealDirective } from '../../components/ui/reveal.directive';
import { TiltDirective } from '../../components/ui/tilt.directive';
import { APP_ROUTES } from '../../core/constants/app.constants';
import { SPICE_KEYWORDS } from '../../core/constants/recipe.constants';
import { LanguageCode } from '../../core/enums/recipe.enum';
import { Recipe } from '../../core/interfaces/recipe.interface';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { describeApiError, getErrorMessage } from '../../core/utils/error.util';

interface RecipeStatBreakdown {
  readonly spices: number;
  readonly fresh: number;
  readonly phases: number;
  readonly timedSteps: number;
}

@Component({
  selector: 'app-ingredients',
  imports: [
    RecipeModifyModalComponent,
    IngredientThumbComponent,
    RecipeHeroPhotoComponent,
    PexelsCreditComponent,
    RevealDirective,
    TiltDirective,
    MagneticDirective,
  ],
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
  protected readonly isModifyOpen = signal<boolean>(false);
  protected readonly isSubmittingModification = signal<boolean>(false);

  // Derived counts for the checklist's stats dashboard.
  protected readonly stats = computed<RecipeStatBreakdown | null>(() => {
    const r = this.recipe();
    if (!r) return null;
    const spices = r.ingredients.filter((ing) => this.isSpice(ing.name)).length;
    return {
      spices,
      fresh: r.ingredients.length - spices,
      phases: r.instructions.length,
      timedSteps: r.instructions.filter((step) => !!step.timeRequired).length,
    };
  });

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

  protected async goToSteps(): Promise<void> {
    const recipe = this.recipe();
    if (recipe) {
      await this.router.navigate(this.routes.recipeSteps(recipe.id));
    }
  }

  private isSpice(name: string): boolean {
    const lower = name.toLowerCase();
    return SPICE_KEYWORDS.some((keyword) => lower.includes(keyword));
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
      const { title, message } = describeApiError(err, 'Could not update this recipe. Please try again.');
      this.toastService.error(message, title);
    } finally {
      this.isSubmittingModification.set(false);
    }
  }
}
