import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { ScrollTrackerService } from '../../core/services/scroll-tracker.service';

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

  private unregister: (() => void) | null = null;

  public ngOnInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.unregister = this.tracker.register(() => {
      const element = this.elementRef.nativeElement;
      const rect = element.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const delta = (viewportCenter - elementCenter) * this.appParallaxSpeed();
      element.style.transform = `translate3d(0, ${delta}px, 0)`;
    });
  }

  public ngOnDestroy(): void {
    this.unregister?.();
  }
}
