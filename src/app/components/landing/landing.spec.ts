import { TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
    }).compileComponents();
  });

  /**
   * A smoke test with teeth: the landing wires up five directives, three
   * child components and two WebGL view slots, and any one of them failing
   * on init would take the signed-out home page down with it.
   */
  it('renders the whole page without a WebGL context', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    // hero, story, kinetic type
    expect(element.querySelectorAll('[appScene]').length).toBe(3);
    expect(element.querySelectorAll('.rush-line').length).toBe(3);
    expect(element.querySelectorAll('.story-panel').length).toBe(4);
    expect(element.querySelectorAll('.story-chapter').length).toBe(4);
    expect(element.querySelector('app-cuisine-carousel')).toBeTruthy();
    expect(document.querySelector('canvas.webgl-canvas')).toBeNull();
  });

  /**
   * The marquee loops by translating its track -50%, which is only seamless
   * while the track holds exactly two copies of the list. Changing the copy
   * count wouldn't break the build or the layout — it would just make the
   * belt visibly jump once per cycle.
   */
  it('builds each marquee belt from exactly two copies of the dish list', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const tracks = (fixture.nativeElement as HTMLElement).querySelectorAll('.marquee-track');

    expect(tracks.length).toBe(2);
    tracks.forEach((track) => {
      expect(track.children.length % 2).toBe(0);
      expect(track.children.length).toBe(16);
    });
  });

  it('gives every decorative image a lazy, sized, non-blocking load', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const orbit = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLImageElement>(
      '.hero-orbit-item',
    );

    expect(orbit.length).toBeGreaterThan(0);
    orbit.forEach((image) => {
      expect(image.getAttribute('loading')).toBe('lazy');
      expect(image.getAttribute('decoding')).toBe('async');
      expect(image.getAttribute('width')).toBeTruthy();
      expect(image.getAttribute('height')).toBeTruthy();
    });
  });
});
