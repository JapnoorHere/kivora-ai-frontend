import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject, input } from '@angular/core';
import { ScrollSceneRegistry } from '../../core/services/scroll-scene-registry.service';
import { ScrollTrackerService } from '../../core/services/scroll-tracker.service';
import { prefersReducedMotion, whileVisible } from '../../core/utils/visibility.util';

const SETTLED = 0.0004;
/**
 * A single frame moving the scene further than this is a flick or a re-entry,
 * not a scrub. Easing across it makes the scene visibly trail the page for
 * half a second, which reads as sticking rather than as weight.
 */
const SNAP_DISTANCE = 0.3;

/**
 * Turns a tall section into a scrubbed "scene": publishes how far the visitor
 * has scrolled through it as a `--p` custom property (0 → 1) that CSS drives
 * transforms off, and mirrors the same value into ScrollSceneRegistry for the
 * WebGL layer.
 *
 * Pinning is plain `position: sticky` on the inner content — no DOM rewriting,
 * no placeholder elements, nothing for Angular to fight over.
 *
 * The published value trails the raw scroll position through an exponential
 * ease, which is what gives the effect its weight — the scene keeps moving for
 * a few frames after the wheel stops instead of snapping to a halt.
 */
@Directive({
  selector: '[appScene]',
})
export class ScrollSceneDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly tracker = inject(ScrollTrackerService);
  private readonly registry = inject(ScrollSceneRegistry);
  private readonly ngZone = inject(NgZone);

  /** Scene name, so other layers can follow this scene's progress. */
  public readonly appScene = input<string>('');

  /** 0 → frozen, 1 → no smoothing. Lower reads heavier. */
  public readonly appSceneEase = input<number>(0.14);

  private target = 0;
  private current = 0;
  private frameId: number | null = null;
  private detach: (() => void) | null = null;

  public ngOnInit(): void {
    const element = this.elementRef.nativeElement;

    if (prefersReducedMotion()) {
      this.write(1);
      return;
    }

    this.detach = whileVisible(element, () => this.activate());
  }

  public ngOnDestroy(): void {
    this.detach?.();
    this.stopSettling();
  }

  private activate(): () => void {
    const element = this.elementRef.nativeElement;
    element.classList.add('scene-active');

    // Scrolling away and back must not resume from wherever the scene was
    // left: the first frame after re-entry adopts the page's real position,
    // and only later frames ease.
    let primed = false;

    const unregister = this.tracker.register({
      measure: () => {
        this.target = this.readProgress();
      },
      apply: () => {
        if (!primed) {
          primed = true;
          this.write(this.target);
          return;
        }
        this.startSettling();
      },
    });

    return () => {
      unregister();
      this.stopSettling();
      element.classList.remove('scene-active');
    };
  }

  /**
   * Progress of a sticky-pinned scene: the element is taller than the viewport
   * by exactly the distance its pinned content should animate over. Sections
   * shorter than the viewport fall back to a plain viewport crossing so the
   * directive still means something on small screens.
   */
  private readProgress(): number {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const travel = rect.height - viewportHeight;

    const raw =
      travel > 0
        ? -rect.top / travel
        : (viewportHeight - rect.top) / (viewportHeight + rect.height);

    return Math.min(1, Math.max(0, raw));
  }

  private startSettling(): void {
    if (this.frameId !== null) return;
    this.ngZone.runOutsideAngular(() => {
      this.frameId = requestAnimationFrame(this.settle);
    });
  }

  private readonly settle = (): void => {
    this.frameId = null;
    const distance = this.target - this.current;
    const magnitude = Math.abs(distance);

    if (magnitude < SETTLED || magnitude > SNAP_DISTANCE) {
      this.write(this.target);
      return;
    }

    this.write(this.current + distance * this.appSceneEase());
    this.startSettling();
  };

  private stopSettling(): void {
    if (this.frameId === null) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  private write(value: number): void {
    this.current = value;
    this.elementRef.nativeElement.style.setProperty('--p', value.toFixed(4));

    const name = this.appScene();
    if (name) {
      this.registry.publish(name, value);
    }
  }
}
