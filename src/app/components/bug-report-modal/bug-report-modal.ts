import { Component, ChangeDetectionStrategy, signal, inject, effect, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { RecipeApiService } from '../../core/services/recipe-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

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
  private readonly toast = inject(ToastService);

  // Modern functional output signal to notify parent components to close modal
  public readonly close = output<void>();

  protected readonly isSubmitting = signal<boolean>(false);

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

    try {
      const payload = this.feedbackForm.getRawValue();
      await this.apiService.submitBugReport(payload);
      this.toast.success('Thank you, Chef! We\'ll look into it right away.', 'Report Submitted');
      this.close.emit();
    } catch (err) {
      this.toast.error(err.message || 'Failed to submit. Please try again.', 'Submission Failed');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
