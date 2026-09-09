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

    // hero, story, sweep, wheel, pass — the kinetic type is the intro now
    expect(element.querySelectorAll('[appScene]').length).toBe(5);
    expect(element.querySelectorAll('.rush-line').length).toBe(0);
    expect(element.querySelectorAll('.story-panel').length).toBe(4);
    expect(element.querySelectorAll('.story-chapter').length).toBe(4);
    expect(element.querySelector('app-cuisine-wheel')).toBeTruthy();
    expect(element.querySelector('app-ticket-rail')).toBeTruthy();
    expect(element.querySelector('app-depth-scene')).toBeTruthy();
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
   * A photograph may only repeat where the repeat *is* the design.
   *
   * An accidental repeat is obvious to a visitor scrolling past the same food
   * in two unrelated sections, and it is the kind of thing that creeps back in
   * the moment someone copies an existing entry to add a new one. But three
   * repeats are load-bearing: they are how one section hands an object to the
   * next instead of putting it down and picking a different one up.
   *
   *   hero dish → story bowl's first chapter (and the bridge that flies it)
   *   story bowl's last chapter → the depth field's leading near dish
   *   depth field's trailing near dish → the wheel's hub
   *
   * Everything else on the page still has to be unique, which is what this
   * actually guards.
   */
  it('repeats a photograph only where one section hands an object to the next', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const images = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLImageElement>('img');

    const photoIds = [...images]
      .map((image) => /photo-([\w-]+)/.exec(image.getAttribute('src') ?? '')?.[1])
      .filter((id): id is string => Boolean(id));

    const handovers = new Set([
      '1546069901-ba9599a7e63c', // hero dish → story bowl, plus the bridge
      '1567620905732-2d1ec7ab7445', // story bowl → depth field
      '1504674900247-0877df9cc836', // depth field → wheel hub
    ]);

    const counts = new Map<string, number>();
    photoIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));

    expect(photoIds.length).toBeGreaterThan(20);

    // Every handover is actually wired up. Without this a broken one would
    // pass silently, by simply not repeating.
    handovers.forEach((id) => expect(counts.get(id) ?? 0).toBeGreaterThan(1));

    [...counts].forEach(([id, count]) => {
      expect(count).toBeLessThanOrEqual(handovers.has(id) ? 3 : 1);
    });
  });

  /**
   * The depth field is entirely a speed ratio: the near plane has to outrun
   * the far one or the three layers collapse into a single sliding sheet.
   * Nothing about that failure looks like an error — it just stops reading as
   * depth — so the distinct speeds are what the test pins.
   */
  it('gives the depth planes distinct speeds', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const planes = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '.depth-plane',
    );

    expect(planes.length).toBe(3);

    const speeds = [...planes].map((plane) => Number(plane.style.getPropertyValue('--speed')));
    speeds.forEach((speed) => expect(speed).toBeGreaterThan(0));
    expect(new Set(speeds).size).toBe(speeds.length);
    // The near plane has to cover meaningfully more ground than the far one.
    expect(Math.max(...speeds) / Math.min(...speeds)).toBeGreaterThan(3);
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
