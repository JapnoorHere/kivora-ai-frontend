import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  viewChild,
} from '@angular/core';
import { DISCOVERY_CATEGORIES } from '../../core/constants/recipe.constants';
import { AuthService } from '../../core/services/auth.service';
import { IntroGateService } from '../../core/services/intro-gate.service';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';
import { CuisineWheelComponent } from '../cuisine-wheel/cuisine-wheel';
import { DepthSceneComponent } from '../depth-scene/depth-scene';
import { TicketRailComponent } from '../ticket-rail/ticket-rail';
import { MagneticDirective } from '../ui/magnetic.directive';
import { MorphBridgeDirective } from '../ui/morph-bridge.directive';
import { ScrollParallaxDirective } from '../ui/scroll-parallax.directive';
import { ScrollProgressDirective } from '../ui/scroll-progress.directive';
import { ScrollSceneDirective } from '../ui/scroll-scene.directive';
import { SplitTextComponent } from '../ui/split-text/split-text';
import { SteamWispComponent } from '../ui/steam-wisp/steam-wisp';
import { StepTimerComponent } from '../ui/step-timer/step-timer';

interface OrbitItem {
  readonly url: string;
  readonly alt: string;
  /** Where the ingredient sits on the ring before it converges. */
  readonly angle: number;
  /** Multiplier on the ring's base radius, which CSS derives from the viewport. */
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
 *
 * The one library involved is Lenis, and it animates nothing — it damps the
 * scroll position itself so the whole page carries weight, and every scene
 * above reads that damped position through the same `--p` as before. See
 * `SmoothScrollService` for why it is started here rather than app-wide.
 */
@Component({
  selector: 'app-landing',
  imports: [
    MagneticDirective,
    MorphBridgeDirective,
    SteamWispComponent,
    ScrollParallaxDirective,
    ScrollProgressDirective,
    ScrollSceneDirective,
    SplitTextComponent,
    StepTimerComponent,
    CuisineWheelComponent,
    DepthSceneComponent,
    TicketRailComponent,
  ],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly introGate = inject(IntroGateService);

  private destroyed = false;

  protected readonly cuisines = DISCOVERY_CATEGORIES;
  protected readonly storySection = viewChild<ElementRef<HTMLElement>>('storySection');

  /**
   * Shown as the hero's plated dish — as a flat photograph, deliberately, and
   * not mapped onto the 3D bowl. The story picks this same dish up as a flat
   * photograph, so drawing it here as a lit 3D bowl changed the object's
   * material halfway through its own handover.
   *
   * Every photograph on this page is used once *per place it appears*: the
   * ring, the story bowl, the two dishes inside COOK and the wheel all draw
   * from disjoint sets, because an accidental repeat is obvious on a page that
   * scrolls past the same food twice.
   *
   * The single exception is deliberate and is the point: this dish is also the
   * story bowl's first chapter, so the object the hero plates is the object
   * the story picks up. See `storyDishes` below.
   */
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
   * The dish inside the travelling bowl, one per story chapter. The windows
   * match the device panels exactly, so the food and the screen change on the
   * same frame: ingredients, then a plated dish, then something cooking, then
   * the personalised result.
   */
  protected readonly storyDishes = [
    {
      /**
       * The hero's dish, still in the bowl.
       *
       * These two sections used to share nothing at all: the hero plated one
       * dish, the strip went past, and the story opened on an unrelated
       * photograph — the page put an object down and picked a different one
       * up. Carrying the hero's dish through the first chapter makes it one
       * bowl travelling, which is the same trick the bowl already plays across
       * the rest of the story.
       *
       * Nothing is duplicated by this: consecutive stages are never pinned at
       * the same time, so the hero's copy has scrolled away before the story's
       * stage arrives.
       */
      url: this.heroDish,
      in: -0.2,
      out: 0.2,
    },
    {
      url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=420&q=72',
      in: 0.13,
      out: 0.53,
    },
    {
      url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=420&q=72',
      in: 0.47,
      out: 0.87,
    },
    {
      url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=420&q=72',
      in: 0.8,
      out: 1.2,
    },
  ];

  /** Three claims that carry the hero's closing screen. */
  protected readonly heroProof = [
    { label: 'Scaled to your table', detail: 'Quantities recalculated for however many are eating.' },
    { label: 'Timed, not guessed', detail: 'Every stage that can go wrong gets its own timer.' },
    { label: 'In your language', detail: 'English, हिन्दी or ਪੰਜਾਬੀ — the whole recipe, not just the title.' },
  ];

  /**
   * Ingredients that spiral inward into the dish as the hero scrubs. Twelve
   * evenly spaced points at alternating radii: fewer, and a widescreen shows
   * a bunched ring with dead space down both sides. `radius` is a multiplier
   * on the base radius CSS derives from the viewport.
   */
  protected readonly orbit: readonly OrbitItem[] = [
    {
      url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 205,
      radius: 0.9,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 235,
      radius: 1.06,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 265,
      radius: 0.86,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 295,
      radius: 1.1,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 325,
      radius: 0.92,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 355,
      radius: 1.04,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 25,
      radius: 0.88,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 55,
      radius: 1.08,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 85,
      radius: 0.94,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 115,
      radius: 0.87,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 145,
      radius: 1.05,
      sizeClass: 'w-14 h-14 md:w-20 md:h-20',
      onMobile: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=200&q=70',
      alt: '',
      angle: 175,
      radius: 0.98,
      sizeClass: 'w-16 h-16 md:w-24 md:h-24',
      onMobile: true,
    },
  ];

  /**
   * Held behind the intro for the same reason the WebGL stage is: the intro is
   * an opaque three-second animation, and a scroll loop started underneath it
   * competes for frames at the most contended moment of the page's life while
   * being invisible and, since the page cannot be scrolled yet, useless.
   */
  public ngOnInit(): void {
    this.introGate.whenClear(() => {
      if (this.destroyed) return;
      this.smoothScroll.start();
    });
  }

  /**
   * Smooth scrolling belongs to this page alone — signing in navigates to the
   * dashboard, which wants its scroll back exactly as the platform ships it.
   */
  public ngOnDestroy(): void {
    this.destroyed = true;
    this.smoothScroll.stop();
  }

  protected startSignup(): void {
    this.authService.promptLogin('signup');
  }

  protected startLogin(): void {
    this.authService.promptLogin('login');
  }

  protected scrollToStory(): void {
    const section = this.storySection()?.nativeElement;
    if (section) {
      this.smoothScroll.scrollTo(section);
    }
  }
}
