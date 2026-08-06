import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, output, signal } from '@angular/core';
import { DISCOVERY_CATEGORIES } from '../../core/constants/recipe.constants';
import { DietaryPreference, LanguageCode } from '../../core/enums/recipe.enum';
import { AuthService } from '../../core/services/auth.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ToastService } from '../../core/services/toast.service';
import { UserApiService } from '../../core/services/user-api.service';
import { getErrorMessage } from '../../core/utils/error.util';
import { MagneticDirective } from '../ui/magnetic.directive';
import { SteamWispComponent } from '../ui/steam-wisp/steam-wisp';

@Component({
  selector: 'app-onboarding-preferences',
  imports: [MagneticDirective, SteamWispComponent],
  templateUrl: './onboarding-preferences.html',
  styleUrl: './onboarding-preferences.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingPreferencesComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly userApi = inject(UserApiService);
  private readonly authService = inject(AuthService);
  private readonly stateService = inject(RecipeStateService);
  private readonly toast = inject(ToastService);

  public readonly completed = output<void>();

  protected readonly cuisines = DISCOVERY_CATEGORIES;
  protected readonly Diet = DietaryPreference;
  protected readonly Language = LanguageCode;
  protected readonly totalSteps = 4;

  protected readonly step = signal<number>(1);
  protected readonly direction = signal<'forward' | 'backward'>('forward');
  protected readonly dietaryPreference = signal<DietaryPreference>(DietaryPreference.VEGETARIAN);
  protected readonly selectedCuisines = signal<ReadonlySet<string>>(new Set());
  protected readonly favoriteDishes = signal<readonly string[]>([]);
  protected readonly dishDraft = signal<string>('');
  protected readonly preferredLanguage = signal<LanguageCode>(this.stateService.currentLanguage());
  protected readonly isSubmitting = signal<boolean>(false);

  protected readonly maxDishes = 5;

  protected readonly stepAnimClass = computed(() => `animate-step-${this.direction()}`);

  protected readonly canContinue = computed(() => {
    if (this.step() === 2) return this.selectedCuisines().size > 0;
    return true;
  });

  public ngOnInit(): void {
    this.document.body.style.overflow = 'hidden';
  }

  public ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  protected next(): void {
    if (!this.canContinue()) return;
    this.direction.set('forward');
    this.step.update((current) => current + 1);
  }

  protected back(): void {
    this.direction.set('backward');
    this.step.update((current) => Math.max(1, current - 1));
  }

  protected selectDiet(value: DietaryPreference): void {
    this.dietaryPreference.set(value);
  }

  protected toggleCuisine(cuisine: string): void {
    this.selectedCuisines.update((current) => {
      const next = new Set(current);
      if (next.has(cuisine)) {
        next.delete(cuisine);
      } else {
        next.add(cuisine);
      }
      return next;
    });
  }

  protected isCuisineSelected(cuisine: string): boolean {
    return this.selectedCuisines().has(cuisine);
  }

  protected onDishInput(event: Event): void {
    this.dishDraft.set((event.target as HTMLInputElement).value);
  }

  protected addDish(): void {
    const dish = this.dishDraft().trim();
    if (!dish || this.favoriteDishes().length >= this.maxDishes) return;
    if (this.favoriteDishes().some((existing) => existing.toLowerCase() === dish.toLowerCase())) return;

    this.favoriteDishes.update((current) => [...current, dish]);
    this.dishDraft.set('');
  }

  protected removeDish(dish: string): void {
    this.favoriteDishes.update((current) => current.filter((existing) => existing !== dish));
  }

  protected skipDishesStep(): void {
    this.favoriteDishes.set([]);
    this.dishDraft.set('');
    this.next();
  }

  protected selectLanguage(value: LanguageCode): void {
    this.preferredLanguage.set(value);
  }

  protected async finish(): Promise<void> {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await this.userApi.savePreferences({
        dietaryPreference: this.dietaryPreference(),
        favoriteCuisines: Array.from(this.selectedCuisines()),
        favoriteDishes: this.favoriteDishes(),
        preferredLanguage: this.preferredLanguage(),
      });
      this.authService.markOnboardingCompleted();
      this.stateService.setLanguage(this.preferredLanguage());
      this.toast.success("Your kitchen is set up. Let's cook!", 'All Set');
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Could not save your preferences. You can try again anytime.'));
    } finally {
      this.isSubmitting.set(false);
      this.completed.emit();
    }
  }

  protected async skip(): Promise<void> {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await this.userApi.savePreferences({
        dietaryPreference: DietaryPreference.NON_VEGETARIAN,
        favoriteCuisines: [this.cuisines[0]],
        favoriteDishes: [],
        preferredLanguage: this.stateService.currentLanguage(),
      });
      this.authService.markOnboardingCompleted();
    } catch {
      // Best-effort — the app works fine without saved preferences either way.
    } finally {
      this.isSubmitting.set(false);
      this.completed.emit();
    }
  }
}
