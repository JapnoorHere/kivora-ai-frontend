import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { ScrollSceneDirective } from '../ui/scroll-scene.directive';
import { WebglViewDirective } from '../ui/webgl-view.directive';

interface WheelSlot {
  readonly name: string;
  readonly note: string;
  readonly image: string;
  readonly tint: string;
  /** Index around the wheel. */
  readonly slot: number;
  /** Scene progress at which this slot reaches the top. */
  readonly at: number;
  /** Fade window for this slot's label and tint, centred on `at`. */
  readonly in: number;
  readonly out: number;
}

const SLOT_COUNT = 6;

/**
 * A wheel of dishes that scroll turns — a dim sum trolley for the page.
 *
 * Whichever dish reaches the top is plated: its name, its note and the
 * section's colour all arrive on the same frame, because all three read the
 * same fade window off the scene's `--p`.
 *
 * Two things are worth knowing about how it is built:
 *
 *  - Each plate carries a counter-rotation equal to the wheel's own, so the
 *    plates stay upright as it turns, like the gondolas on a ferris wheel.
 *  - Clicking a dish scrolls the page to the point where that dish is on top,
 *    rather than rotating the wheel directly. The wheel therefore has exactly
 *    one input — scroll position — so a click can never fight the scrub, and
 *    no transition is needed on a scroll-driven property.
 */
@Component({
  selector: 'app-cuisine-wheel',
  imports: [ScrollSceneDirective, WebglViewDirective],
  templateUrl: './cuisine-wheel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuisineWheelComponent {
  private readonly scene = viewChild.required<ElementRef<HTMLElement>>('scene');
  private readonly document = inject(ElementRef).nativeElement.ownerDocument as Document;

  /**
   * The bowl at the hub of the wheel. Its own photograph — every image on the
   * landing page appears exactly once, including this one.
   */
  protected readonly hubDish =
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=440&q=72';

  protected readonly slots: readonly WheelSlot[] = [
    {
      name: 'Indian',
      note: 'Slow-built masalas and tempered whole spices — the gravy you actually wanted.',
      image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=440&q=72',
      tint: '#7c2d12',
      ...slotTiming(0),
    },
    {
      name: 'Chinese',
      note: 'Wok heat, balanced sauces, and timings that keep the vegetables crisp.',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=440&q=72',
      tint: '#7f1d1d',
      ...slotTiming(1),
    },
    {
      name: 'Italian',
      note: 'Pasta water, emulsions, and three-ingredient sauces that need no rescue.',
      image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=440&q=72',
      tint: '#14532d',
      ...slotTiming(2),
    },
    {
      name: 'Mexican',
      note: 'Charred salsas, soft tortillas, and heat you set the level of.',
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=440&q=72',
      tint: '#78350f',
      ...slotTiming(3),
    },
    {
      name: 'American',
      note: 'Weeknight comfort — the sear, the rest, the sauce, in the right order.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=440&q=72',
      tint: '#1e3a8a',
      ...slotTiming(4),
    },
    {
      name: 'Desserts',
      note: 'Ratios that hold up, with a timer for every stage that can go wrong.',
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=440&q=72',
      tint: '#831843',
      ...slotTiming(5),
    },
  ];

  /**
   * Scrolls to the point in the scene where this dish is at the top. The
   * wheel then turns to meet it as a consequence of the page moving, which is
   * the same thing that happens when the visitor scrolls by hand.
   */
  protected select(slot: WheelSlot): void {
    const element = this.scene().nativeElement;
    const rect = element.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) return;

    const top = rect.top + window.scrollY;
    window.scrollTo({ top: top + travel * slot.at, behavior: this.scrollBehavior() });
  }

  private scrollBehavior(): ScrollBehavior {
    return this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
  }
}

/**
 * Slot `k` sits `k` steps around the wheel and reaches the top at p = k/5, so
 * the first dish is plated at the very start of the scene and the last at the
 * very end — neither edge of the runway is dead scroll. The fade window spans
 * a slot either side, so neighbours cross-fade instead of leaving the centre
 * briefly blank.
 */
function slotTiming(slot: number): Pick<WheelSlot, 'slot' | 'at' | 'in' | 'out'> {
  const at = slot / (SLOT_COUNT - 1);
  const half = 1 / (SLOT_COUNT - 1);
  return { slot, at, in: at - half, out: at + half };
}
