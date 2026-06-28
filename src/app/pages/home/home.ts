import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { AuthService } from '../../core/services/auth.service';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { LoaderService } from '../../core/services/loader.service';
import { CookingInterviewComponent, InterviewResult } from '../../components/cooking-interview/cooking-interview';
import { DISCOVERY_CATEGORIES, ROTATING_PLACEHOLDERS, PRESET_RECIPES, PresetRecipe } from '../../core/constants/recipe.constant';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, CookingInterviewComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly stateService = inject(RecipeStateService);
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(RecipeApiService);
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  private pendingAction: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (this.isAuthenticated() && this.pendingAction) {
        this.pendingAction();
        this.pendingAction = null;
        this.authService.isAuthModalOpen.set(false);
      }
    });
  }

  protected readonly searchControl = new FormControl('');
  protected readonly categories = ['All', ...DISCOVERY_CATEGORIES];
  protected readonly activeCategory = signal<string>('All');
  protected readonly isInterviewOpen = signal<boolean>(false);
  protected readonly customizationQuery = signal<string>('');
  protected readonly customizationPreset = signal<PresetRecipe | null>(null);

  protected readonly placeholders = ROTATING_PLACEHOLDERS;
  protected readonly placeholderIndex = signal<number>(0);
  private placeholderIntervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly filteredPresets = computed(() => {
    const category = this.activeCategory();
    if (category === 'All') return PRESET_RECIPES;
    return PRESET_RECIPES.filter(r => r.cuisine.toLowerCase() === category.toLowerCase());
  });

  public ngOnInit(): void {
    this.startPlaceholderCycle();
  }

  public ngOnDestroy(): void {
    this.stopPlaceholderCycle();
  }

  protected startPlaceholderCycle(): void {
    this.stopPlaceholderCycle();
    this.placeholderIntervalId = setInterval(() => {
      this.placeholderIndex.update(prev => (prev + 1) % this.placeholders.length);
    }, 3000);
  }

  protected stopPlaceholderCycle(): void {
    if (this.placeholderIntervalId) {
      clearInterval(this.placeholderIntervalId);
      this.placeholderIntervalId = null;
    }
  }

  protected onSearchFocus(): void {
    this.stopPlaceholderCycle();
  }

  protected onSearchBlur(): void {
    if (!this.searchControl.value) {
      this.startPlaceholderCycle();
    }
  }

  protected selectCategory(category: string): void {
    this.activeCategory.set(category);
  }

  protected onSearchSubmit(event: Event): void {
    event.preventDefault();
    const query = this.searchControl.value?.trim();
    if (!query) return;

    if (this.isAuthenticated()) {
      this.openInterviewForSearch(query);
    } else {
      this.pendingAction = () => this.openInterviewForSearch(query);
      this.authService.isAuthModalOpen.set(true);
    }
  }

  protected selectPresetRecipe(recipe: PresetRecipe): void {
    if (this.isAuthenticated()) {
      this.openInterviewForPreset(recipe);
    } else {
      this.pendingAction = () => this.openInterviewForPreset(recipe);
      this.authService.isAuthModalOpen.set(true);
    }
  }

  private openInterviewForSearch(query: string): void {
    this.customizationQuery.set(query);
    this.customizationPreset.set(null);
    this.isInterviewOpen.set(true);
  }

  private openInterviewForPreset(recipe: PresetRecipe): void {
    this.customizationQuery.set('');
    this.customizationPreset.set(recipe);
    this.isInterviewOpen.set(true);
  }

  protected onInterviewCancelled(): void {
    this.isInterviewOpen.set(false);
    this.customizationQuery.set('');
    this.customizationPreset.set(null);
  }

  protected async onInterviewSubmit(result: InterviewResult): Promise<void> {
    const preset = this.customizationPreset();
    const recipeName = preset ? preset.name : this.customizationQuery();
    if (!recipeName) return;

    this.isInterviewOpen.set(false);
    this.loaderService.show();

    try {
      const recipe = await this.apiService.generateRecipe({
        recipeName,
        servingsCount: result.servings,
        diet: result.diet,
        cuisine: preset ? preset.cuisine : (this.activeCategory() !== 'All' ? this.activeCategory() : 'General'),
        healthGoals: `${result.servings} servings, diet: ${result.diet}`,
        restrictions: result.exclusions.trim(),
        description: preset ? preset.description : 'Custom recipe via search.',
      });

      this.stateService.setRecipe(recipe);
      this.searchControl.setValue('');
      this.startPlaceholderCycle();
      await this.router.navigate(['/ingredients']);
    } catch (err) {
      console.error('Recipe generation failed:', err);
      alert(err.message || 'Recipe generation failed. Please try again.');
    } finally {
      this.loaderService.hide();
    }
  }

  protected interviewRecipeName(): string {
    const preset = this.customizationPreset();
    return preset ? preset.name : this.customizationQuery();
  }

  protected interviewCuisine(): string {
    return this.customizationPreset()?.cuisine ?? '';
  }
}
