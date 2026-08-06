import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { ScrollTrackerService } from '../../core/services/scroll-tracker.service';
import { prefersReducedMotion, whileVisible } from '../../core/utils/visibility.util';

/**
 * Exposes how far an element has traveled through the viewport as a
 * `--progress` CSS custom property (0 → just entering from the bottom,
 * 1 → fully exited past the top). Consuming CSS drives opacity/scale/
 * translate off it via calc(), so the element scrubs with scroll instead
 * of firing once like a typical reveal-on-scroll.
 *
 * For a section that should pin and animate over a long scroll distance,
 * reach for `[appScene]` instead.
 */
@Directive({
  selector: '[appScrollProgress]',
})
export class ScrollProgressDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly tracker = inject(ScrollTrackerService);

  private progress = 0;
  private detach: (() => void) | null = null;

  public ngOnInit(): void {
    const element = this.elementRef.nativeElement;

    if (prefersReducedMotion()) {
      element.style.setProperty('--progress', '1');
      return;
    }

    this.detach = whileVisible(element, () =>
      this.tracker.register({
        measure: () => {
          const rect = element.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const raw = (viewportHeight - rect.top) / (viewportHeight + rect.height);
          this.progress = Math.min(1, Math.max(0, raw));
        },
        apply: () => element.style.setProperty('--progress', this.progress.toFixed(4)),
      }),
    );
  }

  public ngOnDestroy(): void {
    this.detach?.();
  }
}
