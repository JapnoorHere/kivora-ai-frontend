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

    // hero, story, kinetic type, wheel, pass
    expect(element.querySelectorAll('[appScene]').length).toBe(5);
    expect(element.querySelectorAll('.rush-line').length).toBe(3);
    expect(element.querySelectorAll('.story-panel').length).toBe(4);
    expect(element.querySelectorAll('.story-chapter').length).toBe(4);
    expect(element.querySelector('app-cuisine-wheel')).toBeTruthy();
    expect(element.querySelector('app-ticket-rail')).toBeTruthy();
    expect(document.querySelector('canvas.webgl-canvas')).toBeNull();
  });

  /**
   * The wheel's geometry only works if the plate count matches the arc the
   * CSS divides the circle by. Six plates at 60° apart, with slot k plated at
   * p = k/5 — add or remove one without changing the CSS and the dishes stop
   * lining up with their own labels.
   */
  it('puts six plates on the wheel, evenly spaced across the scene', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const plates = element.querySelectorAll<HTMLElement>('.wheel-plate');
    expect(plates.length).toBe(6);

    plates.forEach((plate, index) => {
      expect(plate.style.getPropertyValue('--slot')).toBe(String(index));
      expect(Number(plate.style.getPropertyValue('--at'))).toBeCloseTo(index / 5, 4);
    });

    // One tint layer and one label per plate, or the colour and the caption
    // drift out of step with the dish at the top.
    expect(element.querySelectorAll('.wheel-tint').length).toBe(6);
    expect(element.querySelectorAll('.wheel-label').length).toBe(6);
  });

  it('hangs every ticket on the rail in service order, the visitor\'s last', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const tickets = element.querySelectorAll<HTMLElement>('.pass-ticket');
    expect(tickets.length).toBe(6);

    const landings = [...tickets].map((ticket) => Number(ticket.style.getPropertyValue('--at')));
    expect(landings).toEqual([...landings].sort((a, b) => a - b));
    expect(tickets[tickets.length - 1].classList).toContain('pass-ticket-own');
  });

  /**
   * No photograph may appear twice anywhere on the page. A repeat is obvious
   * to a visitor scrolling past the same food in two different sections, and
   * it is the kind of thing that creeps back in the moment someone copies an
   * existing entry to add a new one.
   */
  it('uses every photograph exactly once across the whole page', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const images = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLImageElement>('img');

    const photoIds = [...images]
      .map((image) => /photo-([\w-]+)/.exec(image.getAttribute('src') ?? '')?.[1])
      .filter((id): id is string => Boolean(id));

    expect(photoIds.length).toBeGreaterThan(20);
    expect(new Set(photoIds).size).toBe(photoIds.length);
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
