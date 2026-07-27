import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CookingInterviewComponent, InterviewResult } from '../../components/cooking-interview/cooking-interview';
import { FloatingComponent, FloatingElementComponent } from '../../components/ui/parallax-floating/parallax-floating';
import { APP_ROUTES } from '../../core/constants/app.constants';
import { DISCOVERY_CATEGORIES, PRESET_RECIPES, ROTATING_PLACEHOLDERS } from '../../core/constants/recipe.constants';
import { DietaryPreference } from '../../core/enums/recipe.enum';
import { PresetRecipe, Recipe } from '../../core/interfaces/recipe.interface';
import { AuthService } from '../../core/services/auth.service';
import { LoaderService } from '../../core/services/loader.service';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, CookingInterviewComponent, FloatingComponent, FloatingElementComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly stateService = inject(RecipeStateService);
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(RecipeApiService);
  private readonly loaderService = inject(LoaderService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  private scrollListenerAdded = false;
  private animFrameId: number | null = null;
  private lastScrollY = 0;

  private heroContentEl: HTMLElement | null = null;
  private orb1El: HTMLElement | null = null;
  private orb2El: HTMLElement | null = null;
  private orb3El: HTMLElement | null = null;


  protected readonly floatingImages = [
    { url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=600&auto=format&fit=crop', alt: 'Tacos', depth: 0.5, className: 'top-[6%] left-[4%] w-14 h-14 md:top-[14%] md:left-[11%] md:w-24 md:h-24' },
    { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600&auto=format&fit=crop', alt: 'Ramen', depth: 1, className: 'top-[3%] left-[42%] w-14 h-14 md:top-[18%] md:left-[30%] md:w-28 md:h-28' },
    { url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop', alt: 'Pizza', depth: 2, className: 'top-[6%] left-[78%] w-16 h-22 md:top-[10%] md:left-[53%] md:w-40 md:h-52' },
    { url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop', alt: 'Salad', depth: 1, className: 'hidden md:block top-[12%] left-[83%] w-32 h-32' },
    { url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=600&auto=format&fit=crop', alt: 'Waffles', depth: 1.2, className: 'hidden md:block top-[42%] left-[2%] w-36 h-36' },
    { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop', alt: 'Burger', depth: 2, className: 'top-[82%] left-[78%] w-16 h-22 md:top-[60%] md:w-36 md:h-48' },
    { url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop', alt: 'Sushi', depth: 1.5, className: 'hidden md:block top-[64%] left-[10%] w-52 h-36' },
    { url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop', alt: 'Dumplings', depth: 1, className: 'hidden md:block top-[68%] left-[48%] w-32 h-32' },
    { url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?q=80&w=600&auto=format&fit=crop', alt: 'Pasta', depth: 0.7, className: 'hidden md:block top-[36%] left-[90%] w-28 h-28' },
    { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=600&auto=format&fit=crop', alt: 'Pancakes', depth: 1.5, className: 'hidden md:block top-[44%] left-[68%] w-32 h-32' },
    { url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop', alt: 'Curry', depth: 1.1, className: 'top-[84%] left-[4%] w-16 h-16 md:top-[38%] md:left-[22%] md:w-32 md:h-32' }
  ];

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
    if (category === 'All') {
      const grouped: Record<string, PresetRecipe[]> = {};
      PRESET_RECIPES.forEach(r => {
        if (!grouped[r.cuisine]) {
          grouped[r.cuisine] = [];
        }
        if (grouped[r.cuisine].length < 3) {
          grouped[r.cuisine].push(r);
        }
      });
      return Object.values(grouped).flat();
    }
    return PRESET_RECIPES.filter(r => r.cuisine.toLowerCase() === category.toLowerCase());
  });

  // Personalized hero greeting — only meaningful once signed in
  protected readonly greeting = computed(() => {
    const name = this.authService.currentUser()?.name;
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    return name ? `Good ${timeOfDay}, ${name.split(' ')[0]}` : null;
  });

  // Real recent-recipe data only — no fabricated "progress" numbers
  protected readonly continueCookingRecipes = computed(() => this.stateService.recentRecipes().slice(0, 2));

  protected readonly chefsPick = computed(() => this.filteredPresets()[0] ?? PRESET_RECIPES[0]);

  protected readonly vegPicks = computed(() =>
    PRESET_RECIPES.filter(r => r.diet === DietaryPreference.VEGETARIAN).slice(0, 2)
  );

  protected readonly nonVegPicks = computed(() =>
    PRESET_RECIPES.filter(r => r.diet === DietaryPreference.NON_VEGETARIAN).slice(0, 2)
  );

  public ngOnInit(): void {
    this.startPlaceholderCycle();
    this.initScrollParallax();
    if (this.isAuthenticated()) {
      // Best-effort — Continue Cooking simply stays empty if this fails
      this.stateService.loadRecentRecipes().catch(() => undefined);
    }
  }

  public ngOnDestroy(): void {
    this.stopPlaceholderCycle();
    if (this.scrollListenerAdded) {
      window.removeEventListener('scroll', this.handleScroll);
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  private initScrollParallax(): void {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.scrollListenerAdded = true;
      this.handleScroll();
    });
  }

  private readonly handleScroll = (): void => {
    this.lastScrollY = window.scrollY;
    if (this.animFrameId === null) {
      this.animFrameId = requestAnimationFrame(this.updateScrollParallax);
    }
  };

  private readonly updateScrollParallax = (): void => {
    this.animFrameId = null;
    const scrollY = this.lastScrollY;

    if (!this.heroContentEl) {
      this.heroContentEl = document.getElementById('hero-content');
    }
    if (!this.orb1El) {
      this.orb1El = document.getElementById('orb-1');
    }
    if (!this.orb2El) {
      this.orb2El = document.getElementById('orb-2');
    }
    if (!this.orb3El) {
      this.orb3El = document.getElementById('orb-3');
    }

    if (this.heroContentEl) {
      this.heroContentEl.style.transform = `translate3d(0, ${scrollY * 0.12}px, 0)`;
    }
    if (this.orb1El) {
      this.orb1El.style.transform = `translate3d(0, ${scrollY * 0.15}px, 0)`;
    }
    if (this.orb2El) {
      this.orb2El.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
    }
    if (this.orb3El) {
      this.orb3El.style.transform = `translate3d(0, ${scrollY * 0.2}px, 0)`;
    }
  };

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

  protected resumeRecipe(recipe: Recipe): void {
    this.stateService.setRecipe(recipe);
    this.router.navigate(APP_ROUTES.recipeSteps(recipe.id));
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
      const cuisine = preset ? preset.cuisine : (this.activeCategory() !== 'All' ? this.activeCategory() : undefined);
      const recipe = await this.apiService.generateRecipe({
        dishName: recipeName,
        cuisine,
        dietaryPreference: result.diet,
        servings: result.servings,
        exclusions: result.exclusions.trim() || undefined,
        language: result.language,
      });

      this.stateService.setRecipe(recipe);
      this.stateService.setLanguage(result.language);
      this.searchControl.setValue('');
      this.startPlaceholderCycle();
      await this.router.navigate(APP_ROUTES.recipeIngredients(recipe.id));
    } catch (err: unknown) {
      console.error('Recipe generation failed:', err);
      this.toastService.error(getErrorMessage(err, 'Recipe generation failed. Please try again.'));
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
