import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RecipeModifyModalComponent } from '../../components/recipe-modify-modal/recipe-modify-modal';
import { IngredientThumbComponent } from '../../components/ui/ingredient-thumb/ingredient-thumb';
import { MagneticDirective } from '../../components/ui/magnetic.directive';
import { RevealDirective } from '../../components/ui/reveal.directive';
import { StepTimerComponent } from '../../components/ui/step-timer/step-timer';
import { TiltDirective } from '../../components/ui/tilt.directive';
import { APP_ROUTES } from '../../core/constants/app.constants';
import { LanguageCode } from '../../core/enums/recipe.enum';
import { Ingredient, Recipe, RecipeStep } from '../../core/interfaces/recipe.interface';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { describeApiError, getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-steps',
  imports: [RecipeModifyModalComponent, IngredientThumbComponent, RouterLink, RevealDirective, TiltDirective, MagneticDirective, StepTimerComponent],
  templateUrl: './steps.html',
  styleUrl: './steps.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsComponent {
  private readonly router = inject(Router);
  private readonly stateService = inject(RecipeStateService);
  private readonly apiService = inject(RecipeApiService);
  private readonly toastService = inject(ToastService);

  public readonly id = input.required<string>();

  protected readonly routes = APP_ROUTES;
  protected readonly recipe = signal<Recipe | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly activeStepIndex = signal<number>(0);
  protected readonly stepDirection = signal<'next' | 'back'>('next');
  protected readonly isComplete = signal<boolean>(false);
  protected readonly isModifyOpen = signal<boolean>(false);
  protected readonly isSubmittingModification = signal<boolean>(false);
  protected readonly checkedIngredients = signal<ReadonlySet<string>>(new Set());

  protected readonly isLastStep = computed(() => {
    const recipe = this.recipe();
    return !recipe || this.activeStepIndex() >= recipe.instructions.length - 1;
  });

  protected readonly progressPercent = computed(() => {
    const recipe = this.recipe();
    if (!recipe || recipe.instructions.length === 0) return 0;
    return ((this.activeStepIndex() + 1) / recipe.instructions.length) * 100;
  });

  /** Ingredients the current step actually uses; empty for recipes without the data. */
  protected readonly stepIngredients = computed<readonly Ingredient[]>(() => {
    const recipe = this.recipe();
    const step = recipe?.instructions[this.activeStepIndex()];
    const used = step?.ingredientsUsed;
    if (!recipe || !used?.length) return [];
    const wanted = used.map((name) => name.trim().toLowerCase());
    return recipe.ingredients.filter((ing) => wanted.includes(ing.name.trim().toLowerCase()));
  });

  constructor() {
    effect(() => {
      this.loadRecipe(this.id());
    });
  }

  private async loadRecipe(id: string): Promise<void> {
    this.isLoading.set(true);
    this.activeStepIndex.set(0);
    this.isComplete.set(false);
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

  protected goToStep(index: number): void {
    this.stepDirection.set(index >= this.activeStepIndex() ? 'next' : 'back');
    this.activeStepIndex.set(index);
  }

  protected nextStep(): void {
    if (!this.isLastStep()) {
      this.stepDirection.set('next');
      this.activeStepIndex.update((i) => i + 1);
    }
  }

  protected previousStep(): void {
    this.stepDirection.set('back');
    this.activeStepIndex.update((i) => Math.max(0, i - 1));
  }

  protected finishCooking(): void {
    this.isComplete.set(true);
  }

  /** Restart the same recipe from step 1 with a clean checklist. */
  protected cookAgain(): void {
    this.isComplete.set(false);
    this.stepDirection.set('back');
    this.activeStepIndex.set(0);
    this.checkedIngredients.set(new Set());
  }

  protected paddedStepNumber(stepNumber: number): string {
    return stepNumber < 10 ? `0${stepNumber}` : `${stepNumber}`;
  }

  /**
   * Short label for the step navigator. Uses the AI-provided title when present,
   * otherwise falls back to the first clause of the instruction (older recipes
   * were generated before steps carried a title).
   */
  protected stepLabel(step: RecipeStep): string {
    const title = step.title?.trim();
    if (title) return title;

    const firstClause = step.instruction.split(/[.,;:]/)[0].trim();
    const words = firstClause.split(/\s+/).slice(0, 6).join(' ');
    return words.length < firstClause.length ? `${words}…` : words;
  }

  protected isIngredientChecked(name: string): boolean {
    return this.checkedIngredients().has(name);
  }

  protected toggleIngredientCheck(name: string): void {
    this.checkedIngredients.update((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  // Best-effort extraction from free-text AI output like "3 mins" or "30-45 sec".
  // Returns 0 (hides the timer) when nothing parseable is found.
  protected parseTimerSeconds(timeRequired?: string): number {
    if (!timeRequired) return 0;
    const match = timeRequired.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(sec|second|min|minute|hour|hr)/i);
    if (!match) return 0;

    const value = match[2] ? Number(match[2]) : Number(match[1]);
    const unit = match[3].toLowerCase();

    if (unit.startsWith('sec')) return value;
    if (unit.startsWith('hour') || unit.startsWith('hr')) return value * 3600;
    return value * 60;
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
      await this.router.navigate(this.routes.recipeSteps(updated.id));
    } catch (err: unknown) {
      const { title, message } = describeApiError(err, 'Could not update this recipe. Please try again.');
      this.toastService.error(message, title);
    } finally {
      this.isSubmittingModification.set(false);
    }
  }
}
