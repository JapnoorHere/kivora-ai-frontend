import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface RippleRing {
  readonly size: number;
  readonly opacity: number;
  readonly delay: string;
  readonly dashed: boolean;
  readonly borderColor: string;
}

/**
 * Concentric rings breathing outward from the centre — the ambient bed the
 * orbiting garnish sits on. Purely decorative.
 */
@Component({
  selector: 'app-ripple',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (ring of rings(); track $index) {
      <span
        class="ripple-ring"
        [class.border-dashed]="ring.dashed"
        [class.border-solid]="!ring.dashed"
        [style.width.px]="ring.size"
        [style.height.px]="ring.size"
        [style.opacity]="ring.opacity"
        [style.border-color]="ring.borderColor"
        [style.--ripple-delay]="ring.delay"
      ></span>
    }
  `,
  host: {
    class: 'absolute inset-0 flex items-center justify-center pointer-events-none',
    'aria-hidden': 'true',
    style:
      '-webkit-mask-image: linear-gradient(to bottom, black, transparent); mask-image: linear-gradient(to bottom, black, transparent)',
  },
})
export class RippleComponent {
  public readonly baseSize = input<number>(120);
  public readonly ringCount = input<number>(11);
  public readonly baseOpacity = input<number>(0.24);

  protected readonly rings = computed<RippleRing[]>(() => {
    const count = this.ringCount();

    return Array.from({ length: count }, (_, index) => ({
      size: this.baseSize() + index * 70,
      opacity: Math.max(this.baseOpacity() - index * 0.03, 0),
      delay: `${index * 0.06}s`,
      // The outermost ring breaks to a dash so the field fades out as texture
      // rather than ending on a hard drawn edge.
      dashed: index === count - 1,
      borderColor: `rgba(180, 83, 9, ${(5 + index * 5) / 100})`,
    }));
  });
}
