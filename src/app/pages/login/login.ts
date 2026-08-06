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

  protected readonly orbitItems: readonly OrbitItem[] = [
    { url: this.photo('1565299585323-38d6b0865b47'), size: 34, radius: 100, duration: 26, delay: 20 },
    { url: this.photo('1569718212165-3a8278d5f624'), size: 34, radius: 100, duration: 26, delay: 10 },
    { url: this.photo('1513104890138-7c749659a591'), size: 52, radius: 160, duration: 30, delay: 0, reverse: true },
    { url: this.photo('1512621776951-a57141f2eefd'), size: 40, radius: 160, duration: 30, delay: 15, reverse: true },
    { url: this.photo('1563729784474-d77dbb933a9e'), size: 44, radius: 225, duration: 34, delay: 0 },
    { url: this.photo('1568901346375-23c9450c58cd'), size: 52, radius: 225, duration: 34, delay: 17 },
    { url: this.photo('1579871494447-9811cf80d66c'), size: 40, radius: 290, duration: 40, delay: 8, reverse: true },
    { url: this.photo('1546549032-9571cd6b27df'), size: 52, radius: 290, duration: 40, delay: 28, reverse: true },
    { url: this.photo('1563245372-f21724e3856d'), size: 44, radius: 350, duration: 46, delay: 12 },
  ];

  protected readonly guideRings: readonly number[] = [160, 290];

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
