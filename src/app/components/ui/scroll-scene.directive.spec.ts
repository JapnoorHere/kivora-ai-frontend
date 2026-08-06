import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollSceneRegistry } from '../../core/services/scroll-scene-registry.service';
import { ScrollSceneDirective } from './scroll-scene.directive';

@Component({
  imports: [ScrollSceneDirective],
  template: `<section appScene="story" style="height: 400px">scene</section>`,
})
class HostComponent {}

describe('ScrollSceneDirective', () => {
  const realMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  function reduceMotion(reduced: boolean): void {
    window.matchMedia = ((query: string) =>
      ({
        matches: reduced && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  }

  async function render() {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return {
      section: (fixture.nativeElement as HTMLElement).querySelector('section')!,
      registry: TestBed.inject(ScrollSceneRegistry),
    };
  }

  /**
   * Every formula in the motion system is a calc() against `--p`, so resting
   * it at 1 is what makes the reduced-motion page a finished composition
   * rather than a page frozen mid-animation.
   */
  it('rests at finished state when the visitor asks for reduced motion', async () => {
    reduceMotion(true);
    const { section, registry } = await render();

    expect(section.style.getPropertyValue('--p')).toBe('1.0000');
    expect(registry.progress('story')).toBe(1);
  });

  it('starts from zero and stays off the registry until it scrubs', async () => {
    reduceMotion(false);
    const { section, registry } = await render();

    // jsdom never scrolls, so the scene should not have advanced on its own.
    expect(registry.progress('story')).toBe(0);
    expect(Number(section.style.getPropertyValue('--p') || 0)).toBe(0);
  });
});
