import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ScrollSceneRegistry } from '../../core/services/scroll-scene-registry.service';
import { MagneticDirective } from '../ui/magnetic.directive';
import { ScrollProgressDirective } from '../ui/scroll-progress.directive';
import { WebglViewDirective } from '../ui/webgl-view.directive';

interface CuisineSlide {
  readonly name: string;
  readonly blurb: string;
  readonly image: string;
  readonly tint: string;
}

/** Half a second in, the card is edge-on and the swap is invisible. */
const SWAP_DELAY_MS = 500;
const SPIN_DEGREES = 1080;

/**
 * Cuisine showcase built on the flavour-carousel beat: an arrow press spins
 * the dish through three full turns, the section colour crossfades to that
 * cuisine, and the label swaps while the card is edge-on to the viewer.
 *
 * The rotation is published to ScrollSceneRegistry so the WebGL layer, when
 * it is running, can spin the real dish by the same amount.
 */
@Component({
  selector: 'app-cuisine-carousel',
  imports: [MagneticDirective, WebglViewDirective, ScrollProgressDirective],
  templateUrl: './cuisine-carousel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuisineCarouselComponent implements OnDestroy {
  private readonly registry = inject(ScrollSceneRegistry);

  protected readonly slides: readonly CuisineSlide[] = [
    {
      name: 'Indian',
      blurb: 'Slow-built masalas, tempered whole spices, the gravy you actually wanted.',
      image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=560&q=70',
      tint: '#7c2d12',
    },
    {
      name: 'Chinese',
      blurb: 'Wok heat, balanced sauces, and timings that keep vegetables crisp.',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=560&q=70',
      tint: '#7f1d1d',
    },
    {
      name: 'Italian',
      blurb: 'Pasta water, emulsions, and the three-ingredient sauces that need no rescue.',
      image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=560&q=70',
      tint: '#14532d',
    },
    {
      name: 'Mexican',
      blurb: 'Charred salsas, soft tortillas, and heat you set the level of.',
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=560&q=70',
      tint: '#78350f',
    },
    {
      name: 'American',
      blurb: 'Weeknight comfort — the sear, the rest, the sauce, in the right order.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=560&q=70',
      tint: '#1e3a8a',
    },
    {
      name: 'Desserts',
      blurb: 'Ratios that hold up, with timers for every stage that can go wrong.',
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=560&q=70',
      tint: '#831843',
    },
  ];

  protected readonly index = signal<number>(0);
  protected readonly spin = signal<number>(0);
  protected readonly isSwapping = signal<boolean>(false);

  protected readonly slide = computed(() => this.slides[this.index()]);

  private swapTimer: ReturnType<typeof setTimeout> | null = null;

  public ngOnDestroy(): void {
    this.clearSwapTimer();
  }

  protected rotate(direction: 1 | -1): void {
    if (this.isSwapping()) return;

    const next = (this.index() + direction + this.slides.length) % this.slides.length;

    this.isSwapping.set(true);
    this.spin.update((current) => current + SPIN_DEGREES * direction);
    this.registry.publish('carousel-spin', this.spin());

    this.swapTimer = setTimeout(() => {
      this.index.set(next);
      this.isSwapping.set(false);
      this.swapTimer = null;
    }, SWAP_DELAY_MS);
  }

  private clearSwapTimer(): void {
    if (this.swapTimer === null) return;
    clearTimeout(this.swapTimer);
    this.swapTimer = null;
  }
}
