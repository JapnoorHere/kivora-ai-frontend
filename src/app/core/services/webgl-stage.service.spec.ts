import { TestBed } from '@angular/core/testing';
import { WebglStageService } from './webgl-stage.service';

describe('WebglStageService', () => {
  const realMatchMedia = window.matchMedia;

  function capabilities(options: { reducedMotion?: boolean; desktop?: boolean }): void {
    window.matchMedia = ((query: string) => {
      const matches = query.includes('prefers-reduced-motion')
        ? (options.reducedMotion ?? false)
        : (options.desktop ?? true);
      return {
        matches,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;
  }

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    document.querySelector('canvas.webgl-canvas')?.remove();
    document.documentElement.classList.remove('webgl-on');
  });

  function attachView(): HTMLElement {
    const service = TestBed.inject(WebglStageService);
    const element = document.createElement('div');
    service.sync(element, 'hero', 'https://example.test/dish.jpg');
    return element;
  }

  /**
   * The gates are the whole reason the 3D is acceptable on a page that must
   * not feel heavy. If any of them stopped being checked, three.js would be
   * fetched on devices that were never meant to receive it.
   */
  it('declines on a phone-sized viewport', () => {
    capabilities({ desktop: false });
    attachView();

    expect(document.querySelector('canvas.webgl-canvas')).toBeNull();
  });

  it('declines when the visitor asks for reduced motion', () => {
    capabilities({ reducedMotion: true, desktop: true });
    attachView();

    expect(document.querySelector('canvas.webgl-canvas')).toBeNull();
  });

  it('never mounts a canvas synchronously, even when every gate passes', () => {
    capabilities({ desktop: true });
    attachView();

    // Boot is deferred to idle time, so registering a view can never delay
    // whatever the browser was doing when the landing page appeared.
    expect(document.querySelector('canvas.webgl-canvas')).toBeNull();
  });
});
