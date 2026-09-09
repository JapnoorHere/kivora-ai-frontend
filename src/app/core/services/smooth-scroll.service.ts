import { Injectable, NgZone, inject } from '@angular/core';
import Lenis from 'lenis';
import { ScrollTrackerService } from './scroll-tracker.service';
import { prefersReducedMotion } from '../utils/visibility.util';

/**
 * Eased, damped page scrolling for the landing experience.
 *
 * Lenis does not replace the scroll position with a transform — it intercepts
 * the wheel and writes `window.scrollTo` itself, which is the only approach
 * that leaves `position: sticky` working. That matters more here than
 * anywhere else: every scene on the landing page is a sticky-pinned stage, and
 * a transform-based smooth-scroll library would break all of them at once.
 *
 * Three things are deliberate:
 *
 *  - **Started per page, not globally.** The landing page owns the effect;
 *    `/settings`, `/steps` and the rest keep native scrolling, which is what
 *    you want for anything a visitor is reading or filling in rather than
 *    watching.
 *  - **One animation frame for the whole page.** `autoRaf` is off and the loop
 *    here drives both Lenis and `ScrollTrackerService`. Two independent rAF
 *    loops would leave the scroll-linked directives a frame behind the scroll
 *    position they are reacting to.
 *  - **Touch is left alone.** `syncTouch` stays off: native momentum on iOS
 *    and Android beats anything emulated on the main thread, and hijacking it
 *    breaks overscroll and pull-to-refresh. Lenis still reports native touch
 *    scrolling through the same `scroll` event, so the scenes and the parallax
 *    keep working on a phone — they simply aren't damped.
 */
@Injectable({
  providedIn: 'root',
})
export class SmoothScrollService {
  private readonly tracker = inject(ScrollTrackerService);
  private readonly ngZone = inject(NgZone);

  private lenis: Lenis | null = null;
  private frameId: number | null = null;
  private releaseDriver: (() => void) | null = null;

  /**
   * True while Lenis owns the scroll position. Scroll-linked effects read this
   * to drop their own smoothing — see `ScrollSceneDirective`.
   */
  public get isActive(): boolean {
    return this.lenis !== null;
  }

  public start(): void {
    if (this.lenis || prefersReducedMotion()) return;

    // Lenis measures the page through a ResizeObserver and constructs one
    // eagerly. Anywhere that lacks it — a test DOM, an older engine — the page
    // keeps native scrolling, which is a working page rather than a broken
    // one. A capability check, not an error.
    if (typeof ResizeObserver === 'undefined') return;

    // Lenis measures the page through a ResizeObserver and constructs one
    // eagerly. Anywhere that lacks it — a test DOM, an older engine — the page
    // keeps native scrolling, which is a working page rather than a broken
    // one, so this is a capability check and not an error.
    if (typeof ResizeObserver === 'undefined') return;

    // Outside the zone: this loop runs every frame while scrolling, and each
    // pass through it would otherwise schedule a change-detection cycle.
    this.ngZone.runOutsideAngular(() => {
      const lenis = new Lenis({
        /**
         * Lower than the 0.1 default, which is the whole point: the page
         * catches up to the wheel more slowly, so the scroll carries weight
         * instead of tracking the input exactly.
         */
        lerp: 0.075,
        /** One notch of the wheel covers a little less ground than native. */
        wheelMultiplier: 0.9,
        syncTouch: false,
        autoRaf: false,
        /** Anchors go through `scrollTo` below instead. */
        anchors: false,
      });

      // Ticking the tracker from Lenis's own scroll event keeps the reads in
      // the same frame as the write that caused them.
      lenis.on('scroll', this.onLenisScroll);

      this.lenis = lenis;
      this.releaseDriver = this.tracker.claimDriver(this);
      this.frameId = requestAnimationFrame(this.raf);
    });
  }

  public stop(): void {
    if (!this.lenis) return;

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    this.releaseDriver?.();
    this.releaseDriver = null;

    this.lenis.off('scroll', this.onLenisScroll);
    this.lenis.destroy();
    this.lenis = null;

    // The page may have been left mid-ease; put every scroll-linked effect
    // back in step with wherever the scroll actually stopped.
    this.tracker.refresh();
  }

  /**
   * Scrolls to an element or an absolute offset through whichever mechanism is
   * currently in charge.
   *
   * Everything on the page that moves the scroll position has to come through
   * here. A raw `scrollIntoView` or `window.scrollTo({ behavior: 'smooth' })`
   * runs the browser's own animation, which fights Lenis for the same value
   * and leaves the page juddering between the two.
   */
  public scrollTo(target: number | HTMLElement, offset = 0): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, {
        offset,
        duration: 1.9,
        easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      });
      return;
    }

    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';

    if (typeof target === 'number') {
      window.scrollTo({ top: target + offset, behavior });
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior });
  }

  private readonly onLenisScroll = (): void => {
    this.tracker.tick();
  };

  private readonly raf = (time: number): void => {
    this.lenis?.raf(time);
    this.frameId = requestAnimationFrame(this.raf);
  };
}
