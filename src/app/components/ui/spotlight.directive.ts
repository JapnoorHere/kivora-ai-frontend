import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Lights a soft radial glow that tracks the pointer across a form field's
 * border, fading out when the pointer leaves.
 *
 * Only writes CSS custom properties — the gradient itself lives in
 * `.spotlight-field`, so nothing here touches layout or triggers change detection.
 */
@Directive({
  selector: '[appSpotlight]',
  host: {
    class: 'spotlight-field',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerenter)': 'setSize(RADIUS_PX)',
    '(pointerleave)': 'setSize(0)',
  },
})
export class SpotlightDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly RADIUS_PX = 120;

  protected onPointerMove(event: PointerEvent): void {
    const element = this.host.nativeElement;
    const { left, top } = element.getBoundingClientRect();

    element.style.setProperty('--spot-x', `${event.clientX - left}px`);
    element.style.setProperty('--spot-y', `${event.clientY - top}px`);
  }

  protected setSize(size: number): void {
    this.host.nativeElement.style.setProperty('--spot-size', `${size}px`);
  }
}
