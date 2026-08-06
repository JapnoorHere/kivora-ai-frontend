import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';
import { WebglStageService } from '../../core/services/webgl-stage.service';

/**
 * Marks an element as a window onto the shared WebGL stage: whatever rect
 * this element occupies is where the named 3D view gets drawn.
 *
 * The element keeps its own contents — usually the photograph the 3D scene
 * is textured with — so the page is complete before, and if, the stage ever
 * starts. Give those contents `.webgl-fallback` to have them fade out once
 * the real thing is running.
 */
@Directive({
  selector: '[appWebglView]',
})
export class WebglViewDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly stage = inject(WebglStageService);

  public readonly appWebglView = input.required<string>();

  /** Image URL to map onto the dish. Changing it swaps the texture in place. */
  public readonly appWebglTexture = input<string>('');

  constructor() {
    effect(() => {
      this.stage.sync(this.elementRef.nativeElement, this.appWebglView(), this.appWebglTexture());
    });
  }

  public ngOnDestroy(): void {
    this.stage.remove(this.elementRef.nativeElement);
  }
}
