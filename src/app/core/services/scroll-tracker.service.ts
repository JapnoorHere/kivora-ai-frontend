import { Injectable } from '@angular/core';

/**
 * Single shared scroll/resize listener (rAF-throttled) that scroll-linked
 * directives register against, instead of each directive attaching its own
 * window listener.
 */
@Injectable({
  providedIn: 'root',
})
export class ScrollTrackerService {
  private readonly listeners = new Set<() => void>();
  private ticking = false;
  private started = false;

  public register(callback: () => void): () => void {
    this.ensureStarted();
    this.listeners.add(callback);
    callback();
    return () => this.listeners.delete(callback);
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
      this.listeners.forEach((callback) => callback());
      this.ticking = false;
    });
  };
}
