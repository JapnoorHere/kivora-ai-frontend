import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { APP_ROUTES, PASSWORD_MIN_LENGTH } from '../../core/constants/app.constants';
import { PRESET_RECIPES } from '../../core/constants/recipe.constants';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';
import { BoxRevealComponent } from '../../components/ui/box-reveal/box-reveal';
import { OrbitDisplayComponent, OrbitItem } from '../../components/ui/orbit-display/orbit-display';
import { RippleComponent } from '../../components/ui/ripple/ripple';
import { SpotlightDirective } from '../../components/ui/spotlight.directive';
import { MagneticDirective } from '../../components/ui/magnetic.directive';

interface OrbitRing {
  readonly radius: number;
  /** Every item on a ring is the same size — mixed sizes read as clutter. */
  readonly size: number;
  readonly photos: readonly string[];
}

/**
 * Pixels per second every garnish travels, whatever ring it is on. Speed is
 * the property the eye reads as "these belong together"; equal durations
 * across unequal circumferences would make the outer ring visibly race.
 */
const ORBIT_SPEED = 47;

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BoxRevealComponent,
    OrbitDisplayComponent,
    RippleComponent,
    SpotlightDirective,
    MagneticDirective,
  ],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly routes = APP_ROUTES;
  protected readonly isLoginMode = signal<boolean>(true);
  protected readonly showPassword = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly formError = signal<string>('');

  private returnUrl: string = APP_ROUTES.HOME;

  protected readonly heading = computed(() =>
    this.isLoginMode() ? 'Welcome back, Chef' : 'Join Kivora Kitchen',
  );

  protected readonly subHeading = computed(() =>
    this.isLoginMode()
      ? 'Sign in to pick up wherever your last recipe left off.'
      : 'Your first custom recipe is about thirty seconds away.',
  );

  protected readonly authForm = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  public ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.returnUrl = params.get('returnUrl') || APP_ROUTES.HOME;
    this.applyMode(params.get('mode') !== 'signup');

    this.tickerId = setInterval(() => this.dishIndex.update((index) => index + 1), 3600);
  }

  public ngOnDestroy(): void {
    if (this.tickerId !== null) clearInterval(this.tickerId);
  }

  protected switchMode(): void {
    this.formError.set('');
    this.authForm.reset({ name: '', email: '', password: '' });
    this.applyMode(!this.isLoginMode());
  }

  /** Validators follow the mode, so signing in is never gated on the signup rules. */
  private applyMode(loginMode: boolean): void {
    this.isLoginMode.set(loginMode);

    const nameControl = this.authForm.controls.name;
    const passwordControl = this.authForm.controls.password;

    if (loginMode) {
      nameControl.clearValidators();
      passwordControl.setValidators([Validators.required]);
    } else {
      nameControl.setValidators([Validators.required, Validators.minLength(2)]);
      passwordControl.setValidators([Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]);
    }

    nameControl.updateValueAndValidity();
    passwordControl.updateValueAndValidity();
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected async onSubmit(): Promise<void> {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.formError.set('');

    try {
      const { name, email, password } = this.authForm.getRawValue();

      if (this.isLoginMode()) {
        await this.authService.login(email, password);
        this.toast.success('Welcome back, Chef!', 'Signed In');
      } else {
        await this.authService.signup(name, email, password);
        this.toast.success("Your kitchen is ready. Let's cook!", 'Account Created');
      }

      await this.router.navigateByUrl(this.returnUrl);
    } catch (err: unknown) {
      // Shown inline as well as in a toast — on a full page the toast alone is
      // easy to miss, and the message is the only clue about what to change.
      this.formError.set(getErrorMessage(err, 'Authentication failed. Please check your credentials.'));
      this.toast.error(this.formError(), this.isLoginMode() ? 'Sign In Failed' : 'Sign Up Failed');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected get emailControl() { return this.authForm.controls.email; }
  protected get passwordControl() { return this.authForm.controls.password; }
  protected get nameControl() { return this.authForm.controls.name; }

  protected get passwordError(): string {
    return this.passwordControl.hasError('required')
      ? 'Password is required'
      : `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  /**
   * Garnish orbiting the wordmark, described one ring at a time.
   *
   * Only the radius, the item size and the photographs are chosen here.
   * Spacing and speed are derived in `buildOrbit`, because hand-picking a
   * delay per item is how the garnish ended up unevenly bunched: the numbers
   * look arbitrary on the page precisely because they were.
   *
   * On the radii: every one has to clear the wordmark, or an item travels
   * through the word rather than around it. "Kivora" at the xl size is about
   * 270px wide, so half of it is ~135px; add the largest item's own radius
   * and a breathing gap and the innermost orbit lands at 195. Nothing may go
   * inside that, and enlarging the wordmark means raising it. The outer limit
   * is the panel — it is half the viewport, so much past 300 and items start
   * clipping on narrower desktops.
   */
  private readonly orbitRings: readonly OrbitRing[] = [
    {
      radius: 195,
      size: 40,
      photos: ['1565299585323-38d6b0865b47', '1569718212165-3a8278d5f624', '1512621776951-a57141f2eefd'],
    },
    {
      radius: 250,
      size: 46,
      photos: ['1513104890138-7c749659a591', '1563729784474-d77dbb933a9e', '1568901346375-23c9450c58cd'],
    },
    {
      radius: 300,
      size: 52,
      photos: ['1579871494447-9811cf80d66c', '1546549032-9571cd6b27df', '1563245372-f21724e3856d'],
    },
  ];

  protected readonly orbitItems: readonly OrbitItem[] = this.buildOrbit(this.orbitRings);

  /**
   * Derived, never hand-listed. Kept as a separate array these had already
   * drifted out of step with the orbits — two circles drawn for three rings,
   * so a third of the garnish travelled with no visible track under it, which
   * is what made an ordered layout look scattered.
   */
  protected readonly guideRings: readonly number[] = this.orbitRings.map((ring) => ring.radius);

  /**
   * Turns rings into items, deriving the two things that were wrong by hand:
   *
   *  - **Spacing.** The delay is a starting angle in disguise — phase is
   *    `delay / duration` of a turn. Dividing the duration evenly across the
   *    ring puts the garnish at exact equal angles, whatever the count.
   *  - **Speed.** A fixed duration per ring makes the outer items visibly
   *    race, since they cover a longer path in the same time. Deriving the
   *    duration from the circumference instead gives every item the same
   *    linear pace, so the whole set reads as one system turning together.
   *
   * Alternate rings run backwards: neighbouring rings passing each other in
   * opposite directions never settle into a repeating pattern.
   */
  private buildOrbit(rings: readonly OrbitRing[]): readonly OrbitItem[] {
    return rings.flatMap((ring, ringIndex) => {
      const duration = Math.round((2 * Math.PI * ring.radius) / ORBIT_SPEED);
      const spacing = duration / ring.photos.length;
      // Without this every ring would start on the same angles and the garnish
      // would line up as radial spokes; a fraction of a step per ring makes
      // them interleave instead.
      const ringPhase = spacing * (ringIndex / rings.length);

      return ring.photos.map((id, index) => ({
        url: this.photo(id),
        size: ring.size,
        radius: ring.radius,
        duration,
        delay: Number((spacing * index + ringPhase).toFixed(2)),
        reverse: ringIndex % 2 === 1,
      }));
    });
  }

  /**
   * Cycles the app's real preset catalogue rather than inventing activity stats.
   * It gives the panel something alive to look at and previews what the product
   * actually does, which a static form cannot.
   */
  private readonly dishIndex = signal<number>(Math.floor(Math.random() * PRESET_RECIPES.length));
  private tickerId: ReturnType<typeof setInterval> | null = null;

  protected readonly tickerDish = computed(() => PRESET_RECIPES[this.dishIndex() % PRESET_RECIPES.length]);

  protected readonly perks = [
    { icon: '✨', label: 'Say it, we cook it' },
    { icon: '⚖️', label: 'Portions that fit' },
    { icon: '📋', label: 'Your recipe vault' },
  ];

  private photo(id: string): string {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=200&q=70`;
  }
}
