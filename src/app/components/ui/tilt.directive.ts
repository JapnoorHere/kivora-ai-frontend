import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Pointer-reactive 3D tilt with a soft glare — makes a card read like a
 * physical object sitting on a countertop, viewed from slightly above.
 * Desktop/mouse only; a no-op on touch and under prefers-reduced-motion.
 */
@Directive({
  selector: '[appTilt]',
})
export class TiltDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);

  public readonly appTiltMax = input<number>(7);

  private active = false;

  public ngOnInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.active = true;
    const element = this.elementRef.nativeElement;
    element.classList.add('tilt-card');

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
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const max = this.appTiltMax();

    const rotateY = (px - 0.5) * max * 2;
    const rotateX = (0.5 - py) * max * 2;

    element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
    element.style.setProperty('--glare-x', `${px * 100}%`);
    element.style.setProperty('--glare-y', `${py * 100}%`);
    element.style.setProperty('--glare-opacity', '1');
  };

  private readonly handlePointerLeave = (): void => {
    const element = this.elementRef.nativeElement;
    element.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    element.style.setProperty('--glare-opacity', '0');
  };
}
