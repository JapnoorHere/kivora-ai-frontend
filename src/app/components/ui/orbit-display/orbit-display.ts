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
 * Garnish orbiting a wordmark, on concentric rings. Each item is centred on
 * the panel by `.orbit-item` and the CSS `orbit` keyframes swing it out to its
 * own radius, so every orbit shares a centre with the guide rings and with the
 * word itself.
 *
 * Radii are the caller's business, but they are not free choices: an orbit
 * smaller than the wordmark's half-width carries its garnish straight through
 * the word.
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

    <!-- Warm ground under the wordmark, so it reads as lit from behind and
         separates from whatever garnish is passing at the time. Static: a
         blurred or animated backdrop would re-paint every frame. -->
    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(251,191,36,0.32),rgba(251,191,36,0.08)_45%,transparent_70%)]"
      aria-hidden="true"
    ></div>

    <!--
      The stacking position here is load-bearing, not decoration. The wordmark
      is in normal flow while the rings and the garnish are absolutely
      positioned, and positioned boxes paint above in-flow content whatever
      the DOM order — so without a z-index of its own the wordmark is covered
      every time an orbit carries a garnish across it.
    -->
    <span
      class="wordmark relative z-10 pointer-events-none select-none bg-clip-text text-center text-6xl xl:text-7xl font-black leading-[0.85] tracking-[-0.045em] text-transparent"
    >
      {{ text() }}
    </span>

    @if (caption()) {
      <span
        class="relative z-10 mt-5 h-px w-14 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent"
        aria-hidden="true"
      ></span>
      <span class="relative z-10 mt-4 text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
        {{ caption() }}
      </span>
    }

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
  /** Optional line under the wordmark. Omit it and the rule goes too. */
  public readonly caption = input<string>('');
  public readonly ringRadii = input<readonly number[]>([]);
}
