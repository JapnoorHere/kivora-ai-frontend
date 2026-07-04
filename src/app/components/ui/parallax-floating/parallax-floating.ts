import { Component, ElementRef, inject, input, NgZone, OnInit, OnDestroy, effect, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-floating',
  template: `<ng-content></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'absolute top-0 left-0 w-full h-full'
  }
})
export class FloatingComponent implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);

  public readonly sensitivity = input<number>(1);
  public readonly easingFactor = input<number>(0.05);
  public readonly scrollSensitivity = input<number>(0.15);

  private readonly elementsMap = new Map<
    string,
    {
      element: HTMLElement;
      depth: number;
      currentPosition: { x: number; y: number };
    }
  >();

  private mousePosition = { x: 0, y: 0 };
  private currentScrollY = 0;
  private animationFrameId: number | null = null;

  public registerElement(id: string, element: HTMLElement, depth: number): void {
    const existing = this.elementsMap.get(id);
    this.elementsMap.set(id, {
      element,
      depth,
      currentPosition: existing?.currentPosition ?? { x: 0, y: 0 }
    });
  }

  public unregisterElement(id: string): void {
    this.elementsMap.delete(id);
  }

  public ngOnInit(): void {
    // Run outside Angular to avoid triggering change detection on every mouse move, scroll, and frame render
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('touchmove', this.handleTouchMove);
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.startAnimationLoop();
    });
  }

  public ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('scroll', this.handleScroll);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    this.updateMousePosition(event.clientX, event.clientY);
  };

  private readonly handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length > 0) {
      this.updateMousePosition(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  private readonly handleScroll = (): void => {
    this.currentScrollY = window.scrollY;
  };

  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    this.mousePosition = { x: relativeX, y: relativeY };
  }

  private startAnimationLoop(): void {
    const tick = () => {
      this.elementsMap.forEach((data) => {
        const strength = (data.depth * this.sensitivity()) / 20;

        // Calculate target positions
        // 1. Mouse parallax offset
        const mouseX = this.mousePosition.x * strength;
        const mouseY = this.mousePosition.y * strength;

        // 2. Scroll parallax offset (vertical only, scaled by depth and scroll sensitivity)
        const scrollYOffset = this.currentScrollY * data.depth * this.scrollSensitivity();

        const newTargetX = mouseX;
        const newTargetY = mouseY + scrollYOffset;

        // Calculate difference
        const dx = newTargetX - data.currentPosition.x;
        const dy = newTargetY - data.currentPosition.y;

        // Smoothly interpolate positions
        data.currentPosition.x += dx * this.easingFactor();
        data.currentPosition.y += dy * this.easingFactor();

        // Directly manipulate DOM elements for performance
        data.element.style.transform = `translate3d(${data.currentPosition.x}px, ${data.currentPosition.y}px, 0)`;
      });

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }
}

@Component({
  selector: 'app-floating-element',
  template: `<ng-content></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'absolute will-change-transform'
  }
})
export class FloatingElementComponent implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly parent = inject(FloatingComponent);

  public readonly depth = input<number>(1);
  private readonly id = Math.random().toString(36).substring(7);

  constructor() {
    effect(() => {
      const currentDepth = this.depth();
      this.parent.registerElement(this.id, this.elementRef.nativeElement, currentDepth);
    });
  }

  public ngOnInit(): void {
    this.parent.registerElement(this.id, this.elementRef.nativeElement, this.depth());
  }

  public ngOnDestroy(): void {
    this.parent.unregisterElement(this.id);
  }
}
