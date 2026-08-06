import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { DISCOVERY_CATEGORIES } from '../../core/constants/recipe.constants';
import { AuthService } from '../../core/services/auth.service';
import { CuisineCarouselComponent } from '../cuisine-carousel/cuisine-carousel';
import { MagneticDirective } from '../ui/magnetic.directive';
import { RevealDirective } from '../ui/reveal.directive';
import { ScrollProgressDirective } from '../ui/scroll-progress.directive';
import { ScrollSceneDirective } from '../ui/scroll-scene.directive';
import { SplitTextComponent } from '../ui/split-text/split-text';
import { SteamWispComponent } from '../ui/steam-wisp/steam-wisp';
import { StepTimerComponent } from '../ui/step-timer/step-timer';
import { WebglViewDirective } from '../ui/webgl-view.directive';

interface OrbitItem {
  readonly url: string;
  readonly alt: string;
  /** Where the ingredient sits on the ring before it converges. */
  readonly angle: number;
  readonly radius: number;
  readonly sizeClass: string;
  /** Small screens carry a lighter ring — fewer images behind the copy. */
  readonly onMobile: boolean;
}

/**
 * Marketing landing experience for logged-out visitors. Rendered by
 * HomeComponent in place of the search-first dashboard when signed out.
 *
 * The page is built from scroll scenes: `[appScene]` publishes eased progress
 * through a sticky-pinned section as `--p`, and the CSS in styles.css derives
 * every transform from it. No animation library, and nothing animates but
 * transform and opacity.
 */
@Component({
  selector: 'app-landing',
  imports: [
    RevealDirective,
    MagneticDirective,
    SteamWispComponent,
    ScrollProgressDirective,
    ScrollSceneDirective,
    SplitTextComponent,
    StepTimerComponent,
    CuisineCarouselComponent,
    WebglViewDirective,
  ],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private readonly authService = inject(AuthService);

  protected readonly cuisines = DISCOVERY_CATEGORIES;
  protected readonly storySection = viewChild<ElementRef<HTMLElement>>('storySection');

  /** Shown as the hero's plated dish, and mapped onto the 3D bowl if it loads. */
  protected readonly heroDish =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=520&q=72';

  /**
   * The four chapters as a rail. `at` is the scene progress each step sits at:
   * the story is four full screens over three screens of travel, so the steps
   * land on thirds.
   */
  protected readonly journey = [
    { index: '01', label: 'Ask', at: 0 },
    { index: '02', label: 'Plate', at: 0.3333 },
    { index: '03', label: 'Cook', at: 0.6667 },
    { index: '04', label: 'Tune', at: 1 },
  ];

  protected readonly ingredientPreview = [
    { name: 'Chicken thighs', amount: '500 g' },
    { name: 'Butter', amount: '3 tbsp' },
    { name: 'Tomato purée', amount: '1 cup' },
    { name: 'Kasuri methi', amount: '1 tsp' },
    { name: 'Fresh cream', amount: '¼ cup' },
  ];

  protected readonly preferencePreview = [
    {
      label: 'Diet',
      values: [
        { name: 'Vegetarian', on: true },
        { name: 'Vegan', on: false },
        { name: 'Non-Veg', on: false },
      ],
    },
    {
      label: 'Cuisines',
      values: [
        { name: 'Italian', on: true },
        { name: 'Indian', on: true },
        { name: 'Mexican', on: false },
      ],
    },
    {
      label: 'Language',
      values: [
        { name: 'हिन्दी', on: true },
        { name: 'English', on: false },
        { name: 'ਪੰਜਾਬੀ', on: false },
      ],
    },
  ];

  /**
   * The closing belts. Same photographs the hero ring and the carousel use,
   * so the last screen reads as the end of this page rather than a generic
   * sign-up panel.
   */
  protected readonly marqueeDishes = [
    { name: 'Butter Chicken', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=80&q=70' },
    { name: 'Tonkotsu Ramen', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=80&q=70' },
    { name: 'Margherita', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=80&q=70' },
    { name: 'Street Tacos', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=80&q=70' },
    { name: 'Cacio e Pepe', url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=80&q=70' },
    { name: 'Dim Sum', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=80&q=70' },
    { name: 'Belgian Waffles', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=80&q=70' },
    { name: 'Salmon Nigiri', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=80&q=70' },
  ];

  /** Ingredients that spiral inward into the dish as the hero scrubs. */
  protected readonly orbit: readonly OrbitItem[] = [
    {
      url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 205,
      radius: 36,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 250,
      radius: 42,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 295,
      radius: 34,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 340,
      radius: 40,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 25,
      radius: 36,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 70,
      radius: 43,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 115,
      radius: 35,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 160,
      radius: 41,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
  ];

  protected startSignup(): void {
    this.authService.promptLogin('signup');
  }

  protected startLogin(): void {
    this.authService.promptLogin('login');
  }

  protected scrollToStory(): void {
    this.storySection()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
