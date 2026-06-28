import { Component, ChangeDetectionStrategy, signal, inject, output, effect, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LoaderService } from '../../core/services/loader.service';

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
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal<boolean>(false);

  protected togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  // Typed Reactive Form
  protected readonly authForm: FormGroup = this.fb.group({
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
    this.errorMessage.set(null);
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

    this.errorMessage.set(null);
    this.loader.show();

    try {
      const { email, password, name } = this.authForm.value;
      if (this.isLoginMode()) {
        await this.authService.login(email, password);
      } else {
        await this.authService.signup(name, email, password);
      }
      this.authSuccess.emit();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'An error occurred during authentication. Please check your credentials.');
    } finally {
      this.loader.hide();
    }
  }

  // Google sign in helper
  protected async loginWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    this.loader.show();
    try {
      await this.authService.loginWithGoogle();
      this.authSuccess.emit();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Google authentication failed.');
    } finally {
      this.loader.hide();
    }
  }

  // Easy control accessibility getters
  protected get emailControl() { return this.authForm.get('email'); }
  protected get passwordControl() { return this.authForm.get('password'); }
  protected get nameControl() { return this.authForm.get('name'); }
}
