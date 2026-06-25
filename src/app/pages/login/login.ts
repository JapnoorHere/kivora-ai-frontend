import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loaderService = inject(LoaderService);

  protected readonly isLoading = this.loaderService.isLoading;
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isSignUp = signal<boolean>(false);
  protected readonly hidePassword = signal<boolean>(true);

  protected readonly authForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    name: new FormControl('', {
      nonNullable: true,
    }),
  });

  public get emailControl(): FormControl<string> {
    return this.authForm.controls.email;
  }

  public get passwordControl(): FormControl<string> {
    return this.authForm.controls.password;
  }

  public get nameControl(): FormControl<string> {
    return this.authForm.controls.name;
  }

  protected toggleMode(): void {
    this.errorMessage.set(null);
    const mode = !this.isSignUp();
    this.isSignUp.set(mode);

    if (mode) {
      this.nameControl.addValidators(Validators.required);
    } else {
      this.nameControl.clearValidators();
    }
    this.nameControl.updateValueAndValidity();
    this.authForm.reset();
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  protected async onSubmit(): Promise<void> {
    if (this.authForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }

    this.errorMessage.set(null);
    const { name, email, password } = this.authForm.getRawValue();

    try {
      if (this.isSignUp()) {
        await this.authService.signup(name || '', email, password);
      } else {
        await this.authService.login(email, password);
      }
      this.router.navigate(['/']);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.errorMessage.set(err.message);
      } else {
        this.errorMessage.set('An unexpected error occurred.');
      }
    }
  }

  protected async onGoogleLogin(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.errorMessage.set(err.message);
      } else {
        this.errorMessage.set('Google authentication failed.');
      }
    }
  }

  protected async onAppleLogin(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.authService.loginWithGoogle(); // Mock reuse
      this.router.navigate(['/']);
    } catch (err: unknown) {
      this.errorMessage.set('Apple authentication failed.');
    }
  }
}
