import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface SplitChar {
  readonly value: string;
  readonly index: number;
}

interface SplitWord {
  readonly text: string;
  readonly index: number;
  readonly chars: readonly SplitChar[];
}

/**
 * Splits a line into per-word or per-character spans, each carrying its
 * running position as a `--i` custom property.
 *
 * That single number is what makes staggered type possible without an
 * animation library: CSS multiplies `--i` into a transition-delay for an
 * entrance, or into an offset against a scene's `--p` for a scrubbed one.
 *
 * The pieces are hidden from assistive tech and the whole line is exposed
 * once as a label, so a screen reader never spells the heading out letter
 * by letter.
 */
@Component({
  selector: 'app-split-text',
  templateUrl: './split-text.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'split-text',
    'role': 'text',
    '[attr.aria-label]': 'text()',
  },
})
export class SplitTextComponent {
  public readonly text = input.required<string>();

  /** `word` staggers whole words, `char` staggers individual letters. */
  public readonly unit = input<'word' | 'char'>('word');

  protected readonly words = computed<readonly SplitWord[]>(() => {
    const source = this.text().trim();
    if (!source) return [];

    let charIndex = 0;

    return source.split(/\s+/).map((text, index) => {
      const chars = text.split('').map((value) => ({ value, index: charIndex++ }));
      // The gap between words counts as a beat, so the stagger stays even.
      charIndex++;
      return { text, index, chars };
    });
  });
}
