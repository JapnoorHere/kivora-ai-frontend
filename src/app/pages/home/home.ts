import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { BugReportModal } from '../../components/bug-report-modal/bug-report-modal';
import { DISCOVERY_CATEGORIES, ROTATING_PLACEHOLDERS, PRESET_RECIPES, PresetRecipe } from '../../core/constants/recipe.constant';
import { LanguageCode } from '../../core/enums/recipe.enum';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, BugReportModal],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly stateService = inject(RecipeStateService);

  // Expose signals from RecipeStateService
  protected readonly currentLanguage = this.stateService.currentLanguage;
  
  protected readonly searchControl = new FormControl('');
  protected readonly categories = ['All', ...DISCOVERY_CATEGORIES];
  protected readonly activeCategory = signal<string>('All');
  protected readonly isFeedbackOpen = signal<boolean>(false);

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
    if (query) {
      // Trigger Recipe Customization parameter modal (Phase 4)
      console.log('Search executed with query:', query);
    }
  }

  protected selectPresetRecipe(recipe: PresetRecipe): void {
    // Trigger Recipe Customization parameter modal (Phase 4)
    console.log('Preset recipe selected:', recipe.name);
  }

  protected selectLocalizedText(text: any): string {
    return this.stateService.selectLocalizedText(text);
  }
}
