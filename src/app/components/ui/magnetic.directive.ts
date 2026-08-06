import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Gently pulls the element toward the cursor while hovered, like it's
 * being drawn in — a light "magnetic" affordance for primary CTAs and
 * nav icons. Desktop/mouse only; a no-op under prefers-reduced-motion.
 */
@Directive({
  selector: '[appMagnetic]',
})
export class MagneticDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);

  public readonly appMagneticStrength = input<number>(0.3);

  private active = false;

  public ngOnInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.active = true;
    const element = this.elementRef.nativeElement;
    element.classList.add('magnetic');

    this.ngZone.runOutsideAngular(() => {
      element.addEventListener('pointermove', this.handlePointerMove);
      element.addEventListener('pointerleave', this.handlePointerLeave);
    });
  }

  public ngOnDestroy(): void {
    if (!this.active) return;
    const element = this.elementRef.nativeElement;
    element.removeEventListener('pointermove', this.handlePointerMove);
    element.removeEventListener('pointerleave', this.handlePointerLeave);
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;

    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const strength = this.appMagneticStrength();
    const dx = (event.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (event.clientY - (rect.top + rect.height / 2)) * strength;

    element.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  private readonly handlePointerLeave = (): void => {
    this.elementRef.nativeElement.style.transform = 'translate(0, 0)';
  };
}
