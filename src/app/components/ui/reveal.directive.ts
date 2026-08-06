import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Fades + lifts an element into view the first time it crosses the viewport.
 * Pair with [appRevealDelay] (ms) to stagger siblings in a list/grid.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  public readonly appRevealDelay = input<number>(0);

  private observer: IntersectionObserver | null = null;

  public ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    element.style.setProperty('--reveal-delay', `${this.appRevealDelay()}`);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.classList.add('is-revealed');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.classList.add('is-revealed');
            this.observer?.unobserve(element);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    this.observer.observe(element);
  }

  public ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
