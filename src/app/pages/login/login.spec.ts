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
