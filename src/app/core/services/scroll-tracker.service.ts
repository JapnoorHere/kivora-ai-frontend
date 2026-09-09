import { Injectable } from '@angular/core';

/**
 * A scroll-linked task, split into a read phase and a write phase.
 *
 * Every registered `measure()` runs before any `apply()`, so a directive that
 * reads layout (getBoundingClientRect) can never be forced to re-layout by a
 * sibling that already wrote to `style` this frame — the classic read/write
 * thrash that makes scroll-linked effects stutter once you have more than one.
 */
export interface ScrollTask {
  measure(): void;
  apply(): void;
}

/**
 * Single shared scroll/resize listener (rAF-throttled) that scroll-linked
 * directives register against, instead of each directive attaching its own
 * window listener.
 */
@Injectable({
  providedIn: 'root',
})
export class ScrollTrackerService {
  private readonly tasks = new Set<ScrollTask>();
  private ticking = false;
  private started = false;

  /**
   * Set while something else already runs a per-frame loop ending in `tick()`
   * — the smooth-scroll service, which writes the scroll position itself and
   * so knows the new value before the browser's own scroll event reports it.
   */
  private driver: object | null = null;

  public register(task: ScrollTask): () => void {
    this.ensureStarted();
    this.tasks.add(task);
    task.measure();
    task.apply();
    return () => this.tasks.delete(task);
  }

  /** Forces a tick — for callers that changed layout themselves (e.g. a resize of their own content). */
  public refresh(): void {
    this.requestTick();
  }

  /**
   * Hands the scroll-driven tick to an external loop.
   *
   * The scroll listener stays attached but stops scheduling work, so a driver
   * that moves the page itself isn't billed twice per frame: once by its own
   * loop, and again by the scroll event its own `scrollTo` just fired. Resize
   * keeps its own path, which no driver covers.
   */
  public claimDriver(owner: object): () => void {
    this.driver = owner;
    return () => {
      if (this.driver === owner) this.driver = null;
    };
  }

  /**
   * Runs every task's measure phase, then every apply phase, now.
   *
   * Called from inside the driver's animation frame directly after it has
   * written the new scroll position, so the rects read here are already the
   * ones the visitor is about to see — no frame of lag between the two loops.
   */
  public tick(): void {
    this.tasks.forEach((task) => task.measure());
    this.tasks.forEach((task) => task.apply());
  }

  private ensureStarted(): void {
    if (this.started) return;
    this.started = true;
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.requestTick, { passive: true });
  }

  private readonly onScroll = (): void => {
    if (this.driver) return;
    this.requestTick();
  };

  private readonly requestTick = (): void => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.tick();
    });
  };
}
