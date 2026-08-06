/**
 * jsdom ships no `matchMedia`, and every directive in the motion system asks
 * it about prefers-reduced-motion on init — without this stub, rendering any
 * component that uses one throws before the test gets to assert anything.
 *
 * Defaults to "no preference" so specs exercise the animated path.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    public readonly root = null;
    public readonly rootMargin = '';
    public readonly thresholds: readonly number[] = [];
    public observe(): void {}
    public unobserve(): void {}
    public disconnect(): void {}
    public takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}
