import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { LoginComponent } from './login';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

class AuthServiceStub {
  public loginCalls: Array<{ email: string; password: string }> = [];
  public signupCalls: Array<{ name: string; email: string; password: string }> = [];
  public rejectWith: Error | null = null;

  public async login(email: string, password: string) {
    this.loginCalls.push({ email, password });
    if (this.rejectWith) throw this.rejectWith;
    return { email, name: 'Chef' };
  }

  public async signup(name: string, email: string, password: string) {
    this.signupCalls.push({ name, email, password });
    if (this.rejectWith) throw this.rejectWith;
    return { email, name };
  }
}

class RouterStub {
  public navigatedTo: string | null = null;
  public async navigateByUrl(url: string) {
    this.navigatedTo = url;
    return true;
  }
}

describe('LoginComponent', () => {
  let auth: AuthServiceStub;
  let router: RouterStub;

  async function render(queryParams: Record<string, string> = {}) {
    auth = new AuthServiceStub();
    router = new RouterStub();

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    return fixture;
  }

  function fill(element: HTMLElement, id: string, value: string) {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  /**
   * The garnish is meant to read as one system turning, and the two things
   * that break that illusion are invisible in code review: uneven angles
   * between items on a ring, and rings whose items travel at different
   * speeds. Both were wrong when the delays and durations were written by
   * hand, and both are derived now — this is what keeps them derived.
   */
  describe('orbiting garnish', () => {
    interface Placed {
      radius: number;
      duration: number;
      delay: number;
    }

    function readOrbits(element: HTMLElement): Map<number, Placed[]> {
      const rings = new Map<number, Placed[]>();

      element.querySelectorAll<HTMLElement>('.orbit-item').forEach((item) => {
        const placed: Placed = {
          radius: Number(item.style.getPropertyValue('--orbit-radius')),
          duration: Number(item.style.getPropertyValue('--orbit-duration')),
          delay: Number(item.style.getPropertyValue('--orbit-delay')),
        };
        rings.set(placed.radius, [...(rings.get(placed.radius) ?? []), placed]);
      });

      return rings;
    }

    it('spaces the items on each ring at equal angles', async () => {
      const fixture = await render();
      const rings = readOrbits(fixture.nativeElement as HTMLElement);

      expect(rings.size).toBeGreaterThan(1);

      for (const items of rings.values()) {
        // The delay is a starting angle in disguise: phase is delay/duration.
        const phases = items.map((item) => (item.delay / item.duration) % 1).sort((a, b) => a - b);
        const step = 1 / phases.length;

        phases.forEach((phase, index) => {
          const expected = (phases[0] + index * step) % 1;
          expect(Math.abs(phase - expected)).toBeLessThan(0.01);
        });
      }
    });

    it('moves every item at the same linear speed, whatever its ring', async () => {
      const fixture = await render();
      const rings = readOrbits(fixture.nativeElement as HTMLElement);

      const speeds = [...rings.values()].map(
        ([item]) => (2 * Math.PI * item.radius) / item.duration,
      );

      const slowest = Math.min(...speeds);
      const fastest = Math.max(...speeds);
      expect(fastest - slowest).toBeLessThan(2);
    });

    it('keeps every orbit outside the wordmark, and gives each one a track', async () => {
      const fixture = await render();
      const element = fixture.nativeElement as HTMLElement;
      const rings = readOrbits(element);

      // An orbit tighter than this carries its garnish through the word.
      for (const radius of rings.keys()) {
        expect(radius).toBeGreaterThanOrEqual(195);
      }

      // One drawn circle per orbit, or items appear to float with no path.
      const guides = element.querySelectorAll('circle');
      expect(guides.length).toBe(rings.size);
    });
  });

  it('opens in sign-in mode by default', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Welcome back');
    expect(element.querySelector('#chef-email')).toBeTruthy();
  });

  it('honours ?mode=signup from the link that sent the visitor here', async () => {
    const fixture = await render({ mode: 'signup' });
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Join Kivora Kitchen');
  });

  it('signs in and returns to the page the visitor was blocked from', async () => {
    const fixture = await render({ returnUrl: '/settings' });
    const element = fixture.nativeElement as HTMLElement;

    fill(element, 'chef-email', 'chef@example.com');
    fill(element, 'chef-password', 'short');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.loginCalls).toEqual([{ email: 'chef@example.com', password: 'short' }]);
    expect(router.navigatedTo).toBe('/settings');
  });

  /**
   * Sign-in must never inherit the signup length rule — an account created before
   * that rule exists still has to be able to get in.
   */
  it('does not impose a minimum password length when signing in', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    fill(element, 'chef-email', 'chef@example.com');
    fill(element, 'chef-password', 'abc');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.loginCalls.length).toBe(1);
  });

  it('applies the signup rules once the visitor switches modes', async () => {
    const fixture = await render({ mode: 'signup' });
    const element = fixture.nativeElement as HTMLElement;

    fill(element, 'chef-name', 'A');
    fill(element, 'chef-email', 'chef@example.com');
    fill(element, 'chef-password', 'short7c');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.signupCalls.length).toBe(0);

    fill(element, 'chef-name', 'Real Chef');
    fill(element, 'chef-password', 'longenough1');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.signupCalls).toEqual([
      { name: 'Real Chef', email: 'chef@example.com', password: 'longenough1' },
    ]);
    expect(router.navigatedTo).toBe('/');
  });

  /**
   * The server's reason for refusing ("Invalid email or password", "Too many
   * attempts") is the only actionable thing on the page — it has to survive onto
   * the form, not just into a toast that may already have gone.
   */
  it('surfaces the server error inline and stays put', async () => {
    const fixture = await render();
    auth.rejectWith = new Error('Invalid email or password');
    const element = fixture.nativeElement as HTMLElement;

    fill(element, 'chef-email', 'chef@example.com');
    fill(element, 'chef-password', 'wrong-password');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(element.textContent).toContain('Invalid email or password');
    expect(router.navigatedTo).toBeNull();
  });
});
