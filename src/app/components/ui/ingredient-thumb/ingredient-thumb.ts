import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

// Soft tints keyed off the ingredient name — a stable, distinguishable colour per
// ingredient without needing any real image source.
const TILE_TINTS: readonly string[] = [
  'rgba(251,191,36,0.22)',
  'rgba(249,115,22,0.20)',
  'rgba(239,68,68,0.18)',
  'rgba(132,204,22,0.20)',
  'rgba(16,185,129,0.20)',
  'rgba(6,182,212,0.20)',
  'rgba(99,102,241,0.18)',
  'rgba(168,85,247,0.18)',
  'rgba(236,72,153,0.18)',
  'rgba(20,184,166,0.20)',
];

/**
 * Ingredient thumbnail. Renders the `image` when one is provided and loads;
 * otherwise (the norm today — no image source exists) shows a letter tile.
 * A load failure falls back to the same tile.
 */
@Component({
  selector: 'app-ingredient-thumb',
  template: `
    @if (image() && !failed()) {
      <img
        [src]="image()"
        [alt]="name()"
        (error)="failed.set(true)"
        class="w-full h-full object-cover"
        loading="lazy"
      />
    } @else {
      <span
        class="w-full h-full flex items-center justify-center font-black text-slate-700 uppercase leading-none"
        [style.background-color]="tint()"
        aria-hidden="true"
      >{{ letter() }}</span>
    }
  `,
  host: {
    class: 'block overflow-hidden rounded-xl shrink-0 bg-white/60',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientThumbComponent {
  public readonly name = input.required<string>();
  public readonly image = input<string | null>(null);

  protected readonly failed = signal<boolean>(false);

  protected readonly letter = computed(() => this.name().trim().charAt(0) || '?');

  protected readonly tint = computed(() => {
    const n = this.name();
    let hash = 0;
    for (let i = 0; i < n.length; i += 1) {
      hash = (hash * 31 + n.charCodeAt(i)) | 0;
    }
    return TILE_TINTS[Math.abs(hash) % TILE_TINTS.length];
  });
}
