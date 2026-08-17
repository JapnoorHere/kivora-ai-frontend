import { Injectable } from '@angular/core';

/**
 * Holds back work that should not happen while the intro is on screen.
 *
 * The intro is an opaque, full-screen animation for three seconds. Anything
 * that starts underneath it is both invisible and competing for the frame
 * budget at the most contended moment of the page's life — and the WebGL stage
 * in particular judges the device by how fast frames are arriving, so starting
 * it under the intro makes it measure the intro rather than itself.
 */
@Injectable({
  providedIn: 'root',
})
export class IntroGateService {
  private playing = false;
  private readonly waiting: Array<() => void> = [];

  public start(): void {
    this.playing = true;
  }

  public finish(): void {
    if (!this.playing) return;
    this.playing = false;
    this.waiting.splice(0).forEach((run) => run());
  }

  /** Runs immediately if the intro isn't playing, otherwise once it ends. */
  public whenClear(run: () => void): void {
    if (!this.playing) {
      run();
      return;
    }
    this.waiting.push(run);
  }
}
