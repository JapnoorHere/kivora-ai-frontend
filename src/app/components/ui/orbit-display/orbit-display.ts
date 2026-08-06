import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface OrbitItem {
  readonly url: string;
  /** Diameter in px. */
  readonly size: number;
  /** Distance from centre in px. */
  readonly radius: number;
  /** Seconds for one full revolution. */
  readonly duration: number;
  /** Seconds to offset the start by, so items on one ring stay spread apart. */
  readonly delay: number;
  readonly reverse?: boolean;
}

/**
 * Garnish orbiting a wordmark, on concentric rings. Each item is absolutely
 * positioned but given no offsets, so it starts at the flex-centred origin and
 * the CSS `orbit` keyframes swing it out to its own radius.
 */
@Component({
  selector: 'app-orbit-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (ring of ringRadii(); track ring) {
      <svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <circle
          class="stroke-amber-900/10"
          stroke-width="1"
          fill="none"
          cx="50%"
          cy="50%"
          [attr.r]="ring"
        />
      </svg>
    }

    <span
      class="pointer-events-none select-none bg-gradient-to-b from-slate-900 via-slate-800 to-amber-200/40 bg-clip-text text-center text-6xl xl:text-7xl font-black leading-none tracking-tight text-transparent"
    >
      {{ text() }}
    </span>

    @for (item of items(); track item.url) {
      <span
        class="orbit-item"
        [class.is-reverse]="item.reverse"
        [style.--orbit-duration]="item.duration"
        [style.--orbit-delay]="item.delay"
        [style.--orbit-radius]="item.radius"
        [style.width.px]="item.size"
        [style.height.px]="item.size"
      >
        <img
          [src]="item.url"
          alt=""
          [width]="item.size"
          [height]="item.size"
          loading="lazy"
          decoding="async"
          class="h-full w-full rounded-full object-cover shadow-[0_10px_30px_-8px_rgba(120,53,15,0.45)] ring-2 ring-white/70"
          aria-hidden="true"
        />
      </span>
    }
  `,
  host: {
    class: 'relative flex h-full w-full flex-col items-center justify-center overflow-hidden',
  },
})
export class OrbitDisplayComponent {
  public readonly items = input.required<readonly OrbitItem[]>();
  public readonly text = input<string>('Kivora');
  public readonly ringRadii = input<readonly number[]>([]);
}
