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

  private ensureStarted(): void {
    if (this.started) return;
    this.started = true;
    window.addEventListener('scroll', this.requestTick, { passive: true });
    window.addEventListener('resize', this.requestTick, { passive: true });
  }

  private readonly requestTick = (): void => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.tasks.forEach((task) => task.measure());
      this.tasks.forEach((task) => task.apply());
    });
  };
}
