import { Component, ChangeDetectionStrategy, signal, inject, effect, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bug-report-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './bug-report-modal.html',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BugReportModal {
  private readonly apiService = inject(RecipeApiService);
  private readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);

  // Modern functional output signal to notify parent components to close modal
  public readonly close = output<void>();

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isSuccess = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly feedbackForm = new FormGroup({
    email: new FormControl(this.authService.currentUser()?.email || '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });

  constructor() {
    // Add scroll lock class to body while modal is active
    effect((onCleanup) => {
      const body = this.document.body;
      body.classList.add('overflow-hidden');
      onCleanup(() => {
        body.classList.remove('overflow-hidden');
      });
    });
  }

  public get emailControl(): FormControl<string> {
    return this.feedbackForm.controls.email;
  }

  public get messageControl(): FormControl<string> {
    return this.feedbackForm.controls.message;
  }

  protected onEscape(): void {
    this.close.emit();
  }

  protected async onSubmit(): Promise<void> {
    if (this.feedbackForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const payload = this.feedbackForm.getRawValue();
      await this.apiService.submitBugReport(payload);
      this.isSuccess.set(true);
      
      // Delay closing modal slightly to show success feedback message
      setTimeout(() => {
        this.close.emit();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.errorMessage.set(err.message);
      } else {
        this.errorMessage.set('Failed to submit feedback. Please try again.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
