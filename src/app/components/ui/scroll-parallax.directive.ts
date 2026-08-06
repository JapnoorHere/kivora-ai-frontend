import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { ScrollTrackerService } from '../../core/services/scroll-tracker.service';
import { prefersReducedMotion, whileVisible } from '../../core/utils/visibility.util';

/**
 * Classic scroll parallax — translates the element vertically based on how
 * far its center sits from the viewport center. Positive speed drifts with
 * scroll direction, negative speed drifts against it.
 */
@Directive({
  selector: '[appParallax]',
})
export class ScrollParallaxDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly tracker = inject(ScrollTrackerService);

  public readonly appParallaxSpeed = input<number>(0.15);

  private offset = 0;
  private detach: (() => void) | null = null;

  public ngOnInit(): void {
    if (prefersReducedMotion()) return;

    const element = this.elementRef.nativeElement;

    this.detach = whileVisible(element, () =>
      this.tracker.register({
        measure: () => {
          const rect = element.getBoundingClientRect();
          const viewportCenter = window.innerHeight / 2;
          const elementCenter = rect.top + rect.height / 2;
          this.offset = (viewportCenter - elementCenter) * this.appParallaxSpeed();
        },
        apply: () => {
          element.style.transform = `translate3d(0, ${this.offset.toFixed(2)}px, 0)`;
        },
      }),
    );
  }

  public ngOnDestroy(): void {
    this.detach?.();
  }
}
