import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { AuthService } from '../../core/services/auth.service';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { LoaderService } from '../../core/services/loader.service';
import { BugReportModal } from '../../components/bug-report-modal/bug-report-modal';
import { DISCOVERY_CATEGORIES, ROTATING_PLACEHOLDERS, PRESET_RECIPES, PresetRecipe } from '../../core/constants/recipe.constant';
import { LanguageCode, DietaryPreference } from '../../core/enums/recipe.enum';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, BugReportModal],
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

  // Auth intercept states
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

  // Expose signals from RecipeStateService
  protected readonly currentLanguage = this.stateService.currentLanguage;
  
  protected readonly searchControl = new FormControl('');
  protected readonly categories = ['All', ...DISCOVERY_CATEGORIES];
  protected readonly activeCategory = signal<string>('All');
  protected readonly isFeedbackOpen = signal<boolean>(false);

  // Recipe customization controls
  protected readonly isCustomizing = signal<boolean>(false);
  protected readonly customizationQuery = signal<string>('');
  protected readonly customizationPreset = signal<PresetRecipe | null>(null);

  protected readonly servings = signal<number>(2);
  protected readonly selectedDiet = signal<string>('veg');
  protected readonly exclusions = signal<string>('');

  // Rotating placeholder properties
  protected readonly placeholders = ROTATING_PLACEHOLDERS;
  protected readonly placeholderIndex = signal<number>(0);
  private placeholderIntervalId: any = null;

  // Filtered preset recipes list based on active category
  protected readonly filteredPresets = computed(() => {
    const category = this.activeCategory();
    if (category === 'All') {
      return PRESET_RECIPES;
    }
    return PRESET_RECIPES.filter(
      (recipe) => recipe.cuisine.toLowerCase() === category.toLowerCase()
    );
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
      this.placeholderIndex.update((prev) => (prev + 1) % this.placeholders.length);
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
    // Only resume cycling if search input is empty
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
      this.executeSearch(query);
    } else {
      this.pendingAction = () => this.executeSearch(query);
      this.authService.isAuthModalOpen.set(true);
    }
  }

  protected selectPresetRecipe(recipe: PresetRecipe): void {
    if (this.isAuthenticated()) {
      this.executePreset(recipe);
    } else {
      this.pendingAction = () => this.executePreset(recipe);
      this.authService.isAuthModalOpen.set(true);
    }
  }

  private executeSearch(query: string): void {
    this.customizationQuery.set(query);
    this.customizationPreset.set(null);
    this.servings.set(2);
    this.selectedDiet.set('veg');
    this.exclusions.set('');
    this.isCustomizing.set(true);
  }

  private executePreset(recipe: PresetRecipe): void {
    this.customizationQuery.set('');
    this.customizationPreset.set(recipe);
    this.servings.set(2);
    this.selectedDiet.set(recipe.diet === 'nonveg' ? 'nonveg' : 'veg');
    this.exclusions.set('');
    this.isCustomizing.set(true);
  }

  protected cancelCustomization(): void {
    this.isCustomizing.set(false);
    this.customizationQuery.set('');
    this.customizationPreset.set(null);
  }

  protected incrementServings(): void {
    this.servings.update((s) => Math.min(20, s + 1));
  }

  protected decrementServings(): void {
    this.servings.update((s) => Math.max(1, s - 1));
  }

  protected onExclusionsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.exclusions.set(input.value || '');
  }

  protected async generateCustomRecipe(): Promise<void> {
    const preset = this.customizationPreset();
    const query = this.customizationQuery();
    const recipeName = preset ? preset.name : query;

    if (!recipeName) return;

    this.loaderService.show();
    this.isCustomizing.set(false);

    try {
      const payload = {
        recipeName,
        servingsCount: this.servings(),
        diet: this.selectedDiet() as DietaryPreference,
        cuisine: preset ? preset.cuisine : (this.activeCategory() !== 'All' ? this.activeCategory() : 'General'),
        healthGoals: `Portion size customized for ${this.servings()} servings. Diet type: ${this.selectedDiet()}.`,
        restrictions: this.exclusions().trim(),
        description: preset ? preset.description : 'Custom recipe generated via search query.'
      };

      const recipe = await this.apiService.generateRecipe(payload);
      this.stateService.setRecipe(recipe);

      // Clean search input and restore cycles
      this.searchControl.setValue('');
      this.startPlaceholderCycle();

      // Redirect to active cooking ingredients checklist
      await this.router.navigate(['/ingredients']);
    } catch (err: any) {
      console.error('Error generating recipe:', err);
      alert(err.message || 'Recipe generation failed. Please check inputs and try again.');
    } finally {
      this.loaderService.hide();
    }
  }

  protected selectLocalizedText(text: any): string {
    return this.stateService.selectLocalizedText(text);
  }
}
