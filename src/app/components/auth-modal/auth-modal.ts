import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoaderService } from '../../core/services/loader.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthModalComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly loader = inject(LoaderService);
  private readonly toast = inject(ToastService);

  public ngOnInit(): void {
    // Lock page background scrolling
    document.body.style.overflow = 'hidden';
  }

  public ngOnDestroy(): void {
    // Restore page background scrolling
    document.body.style.overflow = '';
  }

  // Outputs to parent
  public readonly close = output<void>();
  public readonly authSuccess = output<void>();

  // State signals
  protected readonly isLoginMode = signal<boolean>(true);
  protected readonly showPassword = signal<boolean>(false);

  protected togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  // Typed Reactive Form
  protected readonly authForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    name: [''],
  });

  constructor() {
    // Dynamically adjust validation rules when switching modes
    effect(() => {
      const nameControl = this.authForm.get('name');
      if (this.isLoginMode()) {
        nameControl?.clearValidators();
        nameControl?.setValue('');
      } else {
        nameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      }
      nameControl?.updateValueAndValidity();
    });
  }

  protected switchMode(loginMode: boolean): void {
    this.isLoginMode.set(loginMode);
    this.authForm.reset({ email: '', password: '', name: '' });
  }

  protected handleClose(): void {
    this.close.emit();
  }

  protected async onSubmit(): Promise<void> {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.loader.show();

    try {
      const { email, password, name } = this.authForm.getRawValue();
      if (this.isLoginMode()) {
        await this.authService.login(email, password);
        this.toast.success('Welcome back, Chef!', 'Signed In');
      } else {
        await this.authService.signup(name, email, password);
        this.toast.success('Your kitchen is ready. Let\'s cook!', 'Account Created');
      }
      this.authSuccess.emit();
      this.close.emit();
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Authentication failed. Please check your credentials.'), 'Sign In Failed');
    } finally {
      this.loader.hide();
    }
  }

  // Google sign in helper
  protected async loginWithGoogle(): Promise<void> {
    this.loader.show();
    try {
      await this.authService.loginWithGoogle();
      this.toast.success('Signed in with Google. Welcome, Chef!', 'Signed In');
      this.authSuccess.emit();
      this.close.emit();
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Google authentication failed. Please try again.'), 'Google Sign In Failed');
    } finally {
      this.loader.hide();
    }
  }

  // Easy control accessibility getters
  protected get emailControl() { return this.authForm.get('email'); }
  protected get passwordControl() { return this.authForm.get('password'); }
  protected get nameControl() { return this.authForm.get('name'); }
}
