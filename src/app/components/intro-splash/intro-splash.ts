import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { prefersReducedMotion } from '../../core/utils/visibility.util';
import { SplitTextComponent } from '../ui/split-text/split-text';

/** Exactly three seconds, as specified. */
const RUN_MS = 3000;
const SEEN_KEY = 'kivora.intro.seen';
/**
 * `?intro=1` replays it on demand. Once a session is the right default and a
 * miserable way to work on the thing — without this, seeing it again means a
 * fresh tab or clearing storage by hand every time.
 */
const FORCE_PARAM = 'intro';


/**
 * The product's intro: COOK / SOMETHING / GREAT assembling and then throwing
 * themselves through the camera, over three seconds, before handing the page
 * over.
 *
 * The motion is entirely declarative — see the intro block in styles.css.
 * Driving it from JS, as the scroll version did, meant rewriting a custom
 * property on an ancestor every frame, which invalidates the whole subtree's
 * style; doing that while Angular boots and the page's images decode is what
 * made it stutter. As keyframes it runs on the compositor and a busy main
 * thread cannot touch it.
 *
 * What is left here is only the decisions: whether to play at all, holding the
 * page still while it does, and getting out of the way on any input.
 */
@Component({
  selector: 'app-intro-splash',
  imports: [SplitTextComponent],
  templateUrl: './intro-splash.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroSplashComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);

  protected readonly isRunning = signal<boolean>(false);

  /** The two dishes standing in for the O's of COOK. */
  protected readonly cookDishes = [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=72',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=72',
  ];

  private timer: ReturnType<typeof setTimeout> | null = null;
  private previousOverflow = '';

  constructor() {
    if (!this.shouldPlay()) return;

    // Marked before the first frame, not after the last: a reload during the
    // intro should not replay it.
    this.remember();
    this.isRunning.set(true);
    this.lockScroll();

    // The animation itself is entirely declarative — see the intro block in
    // styles.css. This only has to take the overlay down when it finishes, and
    // waiting outside the zone keeps a pending timer from holding up stability.
    this.ngZone.runOutsideAngular(() => {
      this.timer = setTimeout(() => this.ngZone.run(() => this.skip()), RUN_MS);
    });
  }

  public ngOnDestroy(): void {
    this.stop();
  }

  /** Any deliberate input ends the intro — three seconds is long enough to resent. */
  protected skip(): void {
    if (!this.isRunning()) return;
    this.stop();
    this.isRunning.set(false);
  }

  private stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.releaseScroll();
  }

  /**
   * Reduced motion skips the intro outright rather than holding a still frame
   * for three seconds — a visitor who asked for less motion asked to get on
   * with it, not to look at the same thing without the movement.
   */
  private shouldPlay(): boolean {
    // Checked first, and it overrides everything: typing ?intro=1 into the
    // address bar is an explicit request, and a flag that silently does
    // nothing is worse than no flag when you are trying to find out why the
    // intro did not appear.
    if (this.isForced()) return true;
    if (prefersReducedMotion()) return false;

    try {
      return this.document.defaultView?.sessionStorage.getItem(SEEN_KEY) === null;
    } catch {
      // Private modes can throw on storage access. An intro is not worth an error.
      return false;
    }
  }

  /** Read straight off the URL: this has to work before any route resolves. */
  private isForced(): boolean {
    const search = this.document.defaultView?.location.search ?? '';
    return new URLSearchParams(search).has(FORCE_PARAM);
  }

  private remember(): void {
    try {
      this.document.defaultView?.sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Nothing to do — it simply plays again next time.
    }
  }

  private lockScroll(): void {
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
  }

  private releaseScroll(): void {
    this.document.body.style.overflow = this.previousOverflow;
  }
}
