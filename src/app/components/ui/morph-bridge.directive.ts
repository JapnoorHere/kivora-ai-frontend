import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { ScrollTrackerService } from '../../core/services/scroll-tracker.service';
import { prefersReducedMotion, whileVisible } from '../../core/utils/visibility.util';

/** Where an object is, how big it is, and which way up — in viewport pixels. */
interface Placement {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly angle: number;
}

/**
 * Carries one object across a section boundary by flying between two others.
 *
 * The problem this solves: the two dishes at either side of a boundary are
 * different elements, in different sticky stages, a viewport of scroll apart.
 * Giving them the same photograph makes them the same *dish*, but the page
 * still puts one down and picks the other up. Copying the dish into the gap
 * does not work either — the donor is pinned and a copy is not, so the two
 * travel at different rates and the visitor simply sees the bowl twice.
 *
 * So: one element, `position: fixed`, that is neither of them. Every frame it
 * measures both endpoints *live* and sits at an interpolation between them.
 * Because the endpoints are measured rather than hard-coded, the bridge is
 * exactly on the donor at `t = 0` and exactly on the receiver at `t = 1` —
 * whatever the viewport size, and whatever each stage's own transform happens
 * to be doing at that moment. All three then take turns being the only visible
 * one, and each swap lands on a frame where two of them coincide, so there is
 * nothing to see.
 *
 * The same trick a shared-element transition uses, driven by scroll rather
 * than by a timeline.
 *
 * Both endpoints must be flat photographs. A donor drawn by the 3D stage and a
 * receiver drawn as an image means the object changes material halfway through
 * its own handover, which undoes the point of carrying it across at all.
 */
@Directive({
  selector: '[appMorphBridge]',
})
export class MorphBridgeDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly tracker = inject(ScrollTrackerService);

  /**
   * The element handing over.
   *
   * Optional because an endpoint inside a child component arrives from a view
   * query, which has not resolved yet when this directive is first created.
   */
  public readonly appMorphBridge = input<HTMLElement | undefined>(undefined);

  /** The element taking over. */
  public readonly appMorphBridgeTo = input<HTMLElement | undefined>(undefined);

  /**
   * The receiving section. Its top edge reaching the top of the viewport is
   * what completes the handover — which is also the moment the receiver's own
   * scene starts, so the bridge finishes exactly where the receiver begins.
   */
  public readonly appMorphBridgeOver = input<HTMLElement | undefined>(undefined);

  /** Ring width in px, matched to the two bowls this one flies between. */
  public readonly appMorphBridgeRing = input<number>(8);

  /** Ring colour. The dark sections carry a far fainter rim than the light ones. */
  public readonly appMorphBridgeRingColor = input<string>('rgb(255 255 255 / 0.7)');

  private from: Placement | null = null;
  private to: Placement | null = null;
  private progress = 0;
  private live = false;

  constructor() {
    // An effect rather than ngOnInit: two of the four endpoints on this page
    // live inside child components and arrive through `viewChild`, which has
    // not resolved during the parent's init pass. This re-arms itself if and
    // when they turn up, and tears down cleanly if they ever go away.
    effect((onCleanup) => {
      const donor = this.appMorphBridge();
      const receiver = this.appMorphBridgeTo();
      const section = this.appMorphBridgeOver();

      if (prefersReducedMotion() || !donor || !receiver || !section) return;

      // A wide margin: the handover starts a viewport before the receiving
      // section arrives, so the default band would switch the bridge on
      // halfway through its own flight.
      const detach = whileVisible(
        section,
        () => {
          const unregister = this.tracker.register({
            measure: () => this.read(donor, receiver, section),
            apply: () => this.write(donor, receiver),
          });
          return () => {
            unregister();
            this.reset(donor, receiver);
          };
        },
        '150% 0px',
      );

      onCleanup(detach);
    });
  }

  private read(donor: HTMLElement, receiver: HTMLElement, section: HTMLElement): void {
    // Either end may be display:none at this breakpoint — the story's pinned
    // stage and the depth field's outer dishes both are on small screens. With
    // nothing to fly between, the boundary keeps the plain cut it always had.
    this.live =
      receiver.getBoundingClientRect().width > 0 && donor.getBoundingClientRect().width > 0;
    if (!this.live) return;

    const span = window.innerHeight * 1.15;
    const travelled = span - section.getBoundingClientRect().top;
    this.progress = Math.min(1, Math.max(0, travelled / span));

    this.from = this.placement(donor);
    this.to = this.placement(receiver);
  }

  /**
   * Reads an element's *visual* circle rather than its layout box.
   *
   * `getBoundingClientRect` returns the axis-aligned bounds of a transformed
   * element, which for a dish tilted 16° is nearly a quarter wider than the
   * dish actually is. The centre of those bounds is still exact, because these
   * stages rotate and scale about their own centre; so the centre comes from
   * the rect, and the size from the layout box scaled by the element's own
   * matrix.
   */
  private placement(element: HTMLElement): Placement {
    const rect = element.getBoundingClientRect();
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    const scale = Math.hypot(matrix.a, matrix.b) || 1;

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      size: element.offsetWidth * scale,
      angle: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
    };
  }

  private write(donor: HTMLElement, receiver: HTMLElement): void {
    const bridge = this.elementRef.nativeElement;

    if (!this.live || !this.from || !this.to) {
      this.reset(donor, receiver);
      return;
    }

    const flying = this.progress > 0 && this.progress < 1;

    // Exactly one of the three is visible at any moment, and on the frame each
    // swap happens the bridge sits on the identical rect — so the handover has
    // no frame in which anything jumps or doubles.
    bridge.style.opacity = flying ? '1' : '0';
    donor.style.opacity = this.progress > 0 ? '0' : '';
    receiver.style.opacity = this.progress < 1 ? '0' : '';

    if (!flying) return;

    // Smoothstep: the dish leaves and arrives at rest instead of tracking the
    // scroll linearly, which is what makes it read as one object settling into
    // a new home rather than being dragged there.
    const t = this.progress * this.progress * (3 - 2 * this.progress);
    const x = this.from.x + (this.to.x - this.from.x) * t;
    const y = this.from.y + (this.to.y - this.from.y) * t;
    const size = this.from.size + (this.to.size - this.from.size) * t;
    const angle = this.from.angle + (this.to.angle - this.from.angle) * t;

    const base = bridge.offsetWidth || 1;
    const scale = size / base;

    // With `transform-origin: 0 0` the chain reads right to left: centre the
    // box on its own origin, turn it, scale it, then put that centre at (x, y).
    bridge.style.transform =
      `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
      `scale(${scale.toFixed(4)}) rotate(${angle.toFixed(2)}deg) translate(-50%, -50%)`;

    // The ring and the shadow scale along with everything else, so they are
    // pre-divided here to land at the weight the two real bowls carry. A ring
    // that thins to nothing on the way across is the one part of the illusion
    // the eye does catch.
    const ring = (this.appMorphBridgeRing() / scale).toFixed(2);
    const lift = (40 / scale).toFixed(2);
    const spread = (90 / scale).toFixed(2);
    const pull = (25 / scale).toFixed(2);
    bridge.style.boxShadow =
      `0 0 0 ${ring}px ${this.appMorphBridgeRingColor()}, ` +
      `0 ${lift}px ${spread}px -${pull}px rgb(0 0 0 / 0.45)`;
  }

  private reset(donor: HTMLElement, receiver: HTMLElement): void {
    this.elementRef.nativeElement.style.opacity = '0';
    donor.style.opacity = '';
    receiver.style.opacity = '';
  }
}
