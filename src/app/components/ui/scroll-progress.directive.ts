import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { ScrollTrackerService } from '../../core/services/scroll-tracker.service';

/**
 * Exposes how far an element has traveled through the viewport as a
 * `--progress` CSS custom property (0 → just entering from the bottom,
 * 1 → fully exited past the top). Consuming CSS drives opacity/scale/
 * translate off it via calc(), so the whole story section scrubs with
 * scroll instead of firing once like a typical reveal-on-scroll.
 */
@Directive({
  selector: '[appScrollProgress]',
})
export class ScrollProgressDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly tracker = inject(ScrollTrackerService);

  private unregister: (() => void) | null = null;

  public ngOnInit(): void {
    const element = this.elementRef.nativeElement;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.style.setProperty('--progress', '1');
      return;
    }

    this.unregister = this.tracker.register(() => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const raw = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const progress = Math.min(1, Math.max(0, raw));
      element.style.setProperty('--progress', progress.toString());
    });
  }

  public ngOnDestroy(): void {
    this.unregister?.();
  }
}
