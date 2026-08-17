import { Injectable, NgZone, inject } from '@angular/core';
import type { StageHandle } from '../../webgl/kitchen-stage';
import { IntroGateService } from './intro-gate.service';
import { ScrollSceneRegistry } from './scroll-scene-registry.service';
import { ScrollTrackerService } from './scroll-tracker.service';
import { prefersReducedMotion } from '../utils/visibility.util';

interface RegisteredView {
  readonly name: string;
  readonly element: HTMLElement;
  readonly texture?: string;
}

interface CapabilityHints {
  readonly deviceMemory?: number;
  readonly connection?: { saveData?: boolean };
}

/**
 * Owns the landing page's WebGL layer without ever importing three.js.
 *
 * three is reached through a dynamic import that only fires once four gates
 * pass — motion is welcome, the viewport is desktop-sized, the connection
 * isn't metered, and the device has memory to spare — and even then only
 * after the browser reports itself idle. Until that happens, and permanently
 * on phones, the CSS landing runs on its own, so nothing here can delay first
 * paint or interactivity.
 *
 * If the import fails, the gates say no, or the GL context is lost, the page
 * simply stays on its CSS animations. The 3D is never load-bearing.
 */
@Injectable({
  providedIn: 'root',
})
export class WebglStageService {
  private readonly registry = inject(ScrollSceneRegistry);
  private readonly tracker = inject(ScrollTrackerService);
  private readonly introGate = inject(IntroGateService);
  private readonly ngZone = inject(NgZone);

  private readonly views = new Map<HTMLElement, RegisteredView>();
  private readonly rects = new Map<string, DOMRectReadOnly>();
  private handle: StageHandle | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private unmeasure: (() => void) | null = null;
  private state: 'idle' | 'booting' | 'running' | 'declined' = 'idle';

  /** Adds or updates a viewport. Returns a teardown for the caller's lifecycle. */
  public sync(element: HTMLElement, name: string, texture?: string): void {
    this.views.set(element, { name, element, texture });
    this.push();
  }

  public remove(element: HTMLElement): void {
    if (!this.views.delete(element)) return;

    if (this.views.size === 0) {
      this.teardown();
      return;
    }
    this.push();
  }

  private push(): void {
    if (this.handle) {
      const views = [...this.views.values()].map(({ name, texture }) => ({ name, texture }));
      this.ngZone.runOutsideAngular(() => this.handle?.syncViews(views));
      return;
    }

    if (this.state === 'idle') {
      this.scheduleBoot();
    }
  }

  /**
   * Rects are measured in the shared tracker's read phase — before any scene
   * directive writes a custom property — so the render loop never has to touch
   * layout itself.
   */
  private startMeasuring(): void {
    if (this.unmeasure) return;

    this.unmeasure = this.tracker.register({
      measure: () => {
        this.rects.clear();
        this.views.forEach((view) => this.rects.set(view.name, view.element.getBoundingClientRect()));
      },
      apply: () => undefined,
    });
  }

  private scheduleBoot(): void {
    if (!this.isCapable()) {
      this.state = 'declined';
      return;
    }

    this.state = 'booting';

    // Checked when idle rather than up front: the intro mounts after the page
    // it covers, so at this point it may not have started yet.
    //
    // Starting under the intro is worse than pointless. The stage is hidden
    // behind an opaque overlay, and the frame-time guard would be measuring a
    // three-second full-screen animation instead of the scene — reading the
    // device as too slow and shutting the 3D down for good.
    const boot = () => this.introGate.whenClear(() => void this.boot());

    this.ngZone.runOutsideAngular(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(boot, { timeout: 3000 });
      } else {
        setTimeout(boot, 1200);
      }
    });
  }

  private async boot(): Promise<void> {
    if (this.state !== 'booting' || this.views.size === 0) return;

    try {
      const { createStage } = await import('../../webgl/kitchen-stage');
      if (this.state !== 'booting' || this.views.size === 0) return;

      const canvas = this.createCanvas();
      this.startMeasuring();

      this.ngZone.runOutsideAngular(() => {
        this.handle = createStage({
          canvas,
          progress: (name) => this.registry.progress(name),
          rect: (name) => this.rects.get(name) ?? null,
          onContextLost: () => this.teardown(),
          onDegraded: () => this.teardown(),
        });
        this.handle.syncViews([...this.views.values()].map(({ name, texture }) => ({ name, texture })));
      });

      this.state = 'running';
      document.documentElement.classList.add('webgl-on');
    } catch {
      // No WebGL, a blocked chunk, a dead GPU — the CSS landing covers all of it.
      this.state = 'declined';
      this.removeCanvas();
    }
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'webgl-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    this.canvas = canvas;
    return canvas;
  }

  private removeCanvas(): void {
    this.canvas?.remove();
    this.canvas = null;
  }

  private teardown(): void {
    this.handle?.dispose();
    this.handle = null;
    this.unmeasure?.();
    this.unmeasure = null;
    this.rects.clear();
    this.removeCanvas();
    document.documentElement.classList.remove('webgl-on');
    // A stage that ran and stopped is not retried: whatever ended it — a lost
    // context, a device that couldn't keep up — will still be true next time.
    this.state = this.state === 'running' ? 'declined' : 'idle';
  }

  /**
   * Deliberately conservative. A landing page is the wrong place to find out
   * a device can't cope, so anything ambiguous is treated as a no.
   */
  private isCapable(): boolean {
    if (prefersReducedMotion()) return false;
    if (!window.matchMedia('(min-width: 768px)').matches) return false;

    const hints = navigator as Navigator & CapabilityHints;
    if (hints.connection?.saveData) return false;
    if ((hints.deviceMemory ?? 8) < 4) return false;
    if ((navigator.hardwareConcurrency ?? 8) < 4) return false;

    return true;
  }
}
