import { TestBed } from '@angular/core/testing';
import { IntroSplashComponent } from './intro-splash';

describe('IntroSplashComponent', () => {
  const realMatchMedia = window.matchMedia;

  function reduceMotion(reduced: boolean): void {
    window.matchMedia = ((query: string) =>
      ({
        matches: reduced && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  }

  beforeEach(() => {
    sessionStorage.clear();
    reduceMotion(false);
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    sessionStorage.clear();
    document.body.style.overflow = '';
  });

  async function render() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [IntroSplashComponent] }).compileComponents();
    const fixture = TestBed.createComponent(IntroSplashComponent);
    await fixture.whenStable();
    return fixture;
  }

  function overlayOf(fixture: { nativeElement: unknown }): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.intro-splash');
  }

  it('plays on a first visit and holds the page still while it runs', async () => {
    const fixture = await render();

    expect(overlayOf(fixture)).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
  });

  /**
   * The guard is written before the first frame rather than after the last, so
   * a reload part-way through the intro does not replay it.
   */
  it('does not play twice in a session', async () => {
    await render();
    const second = await render();

    expect(overlayOf(second)).toBeNull();
  });

  /**
   * A visitor who asked for less motion asked to get on with it — the intro is
   * skipped outright, not held as a still frame for three seconds.
   */
  it('never plays under reduced motion, and leaves scrolling alone', async () => {
    reduceMotion(true);
    const fixture = await render();

    expect(overlayOf(fixture)).toBeNull();
    expect(sessionStorage.getItem('kivora.intro.seen')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('replays on demand for ?intro=1, session flag or not', async () => {
    await render();
    expect(overlayOf(await render())).toBeNull();

    history.replaceState(null, '', '?intro=1');
    try {
      expect(overlayOf(await render())).toBeTruthy();
    } finally {
      history.replaceState(null, '', location.pathname);
    }
  });

  /**
   * The motion is declarative, so what can silently break is the wiring the
   * keyframes read: the per-line index that staggers the entrances and the
   * per-character index that drops the letters in. Both are plain numbers in
   * the template, and neither shows up as an error if it goes missing.
   */
  it('gives every line and character the indices the keyframes animate from', async () => {
    const fixture = await render();
    const stage = overlayOf(fixture)!;

    const lines = stage.querySelectorAll<HTMLElement>('.rush-line');
    expect(lines.length).toBe(3);
    lines.forEach((line, index) => {
      expect(line.style.getPropertyValue('--n')).toBe(String(index));
      expect(line.style.getPropertyValue('--dir')).not.toBe('');
    });

    const chars = stage.querySelectorAll<HTMLElement>('.split-char');
    expect(chars.length).toBeGreaterThan(10);
    chars.forEach((char) => expect(char.style.getPropertyValue('--i')).not.toBe(''));

    stage.querySelectorAll<HTMLElement>('.dish-o').forEach((dish) => {
      expect(dish.style.getPropertyValue('--roll-from')).not.toBe('');
      expect(dish.style.getPropertyValue('--roll-spin')).not.toBe('');
    });
  });

  /**
   * The keyframes are held paused until a frame has been painted. Without the
   * class that releases them the overlay sits frozen on its first frame, which
   * is a black screen — so the release is worth asserting on its own.
   */
  it('releases the keyframes only once a frame has been painted', async () => {
    const fixture = await render();
    expect(overlayOf(fixture)!.classList).not.toContain('is-playing');

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(overlayOf(fixture)!.classList).toContain('is-playing');
  });

  it('ends on any input and releases the page', async () => {
    const fixture = await render();
    overlayOf(fixture)!.dispatchEvent(new Event('click'));
    await fixture.whenStable();

    expect(overlayOf(fixture)).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});
