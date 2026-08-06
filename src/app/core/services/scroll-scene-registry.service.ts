import { Injectable } from '@angular/core';

/**
 * Shared board of named scroll-scene progress values (0 → 1).
 *
 * `ScrollSceneDirective` publishes here; anything that needs to move in step
 * with a section — including the WebGL layer, which has no DOM of its own —
 * reads by name instead of duplicating the scroll maths.
 *
 * Deliberately plain numbers rather than signals: these change every frame
 * while scrolling, and consumers already run inside their own animation loop.
 * Routing them through signals would schedule a change-detection pass per
 * frame for values no template ever reads.
 */
@Injectable({
  providedIn: 'root',
})
export class ScrollSceneRegistry {
  private readonly scenes = new Map<string, number>();

  public progress(name: string): number {
    return this.scenes.get(name) ?? 0;
  }

  public publish(name: string, value: number): void {
    this.scenes.set(name, value);
  }
}
