import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Recurring signature motif: a wisp of steam that draws on and dissolves,
 * looping softly. Purely decorative — aria-hidden.
 */
@Component({
  selector: 'app-steam-wisp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="steam-wisp"
      [class.steam-wisp-sm]="size() === 'sm'"
      viewBox="0 0 60 120"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 112 C 24 92, 2 78, 15 58 C 26 40, 6 26, 17 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <path d="M30 114 C 42 94, 20 80, 32 60 C 43 42, 24 28, 34 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <path d="M48 110 C 59 90, 38 76, 50 56 C 60 38, 42 24, 52 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  `,
  host: {
    class: 'inline-block pointer-events-none select-none text-amber-400/50',
  },
})
export class SteamWispComponent {
  public readonly size = input<'sm' | 'md'>('md');
}
