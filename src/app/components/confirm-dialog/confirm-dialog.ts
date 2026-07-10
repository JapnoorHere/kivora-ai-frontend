import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  // Customizable input signals for reusability
  public readonly title = input<string>('Confirm Action');
  public readonly message = input<string>('Are you sure you want to proceed?');
  public readonly confirmText = input<string>('Confirm');
  public readonly cancelText = input<string>('Cancel');
  public readonly type = input<'default' | 'danger' | 'warning'>('default');

  // Interactive outputs
  public readonly confirm = output<void>();
  public readonly cancel = output<void>();

  protected handleOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
