import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { KITCHEN_WISDOM } from '../../core/constants/recipe.constants';
import { MagneticDirective } from '../ui/magnetic.directive';
import { RevealDirective } from '../ui/reveal.directive';
import { SplitTextComponent } from '../ui/split-text/split-text';
import { SteamWispComponent } from '../ui/steam-wisp/steam-wisp';

const ROTATE_MS = 7000;

/**
 * Sits at the natural end of every authenticated page. Deliberately on-brand
 * rather than generic boilerplate — a rotating line of kitchen wisdom instead
 * of a wall of links a cooking app has no real use for. Carries the same
 * motion vocabulary as the landing page (split-text stagger, steam wisp,
 * magnetic hover) rather than sitting there inert.
 */
@Component({
  selector: 'app-footer',
  imports: [RevealDirective, SteamWispComponent, SplitTextComponent, MagneticDirective],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnDestroy {
  protected readonly currentYear = new Date().getFullYear();

  private readonly tips = KITCHEN_WISDOM;
  // Starts on a random line so every session doesn't open on the same one.
  private readonly tipIndex = signal<number>(Math.floor(Math.random() * KITCHEN_WISDOM.length));
  protected readonly tip = computed(() => this.tips[this.tipIndex()]);

  private readonly intervalId: ReturnType<typeof setInterval> = setInterval(() => {
    this.tipIndex.update((i) => (i + 1) % this.tips.length);
  }, ROTATE_MS);

  public ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
