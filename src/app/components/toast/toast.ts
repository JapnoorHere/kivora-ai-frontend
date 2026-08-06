import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastType } from '../../core/interfaces/toast.interface';
import { ToastService } from '../../core/services/toast.service';
import { MagneticDirective } from '../ui/magnetic.directive';

@Component({
  selector: 'app-toast',
  imports: [MagneticDirective],
  templateUrl: './toast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);

  protected readonly toasts = this.toastService.toasts;
  protected readonly exitingIds = this.toastService.exitingIds;

  private static readonly BG_COLORS: Record<ToastType, string> = {
    success: '#14532D',
    error:   '#7F1D1D',
    warning: '#78350F',
    info:    '#1E3A8A',
  };

  private static readonly ICON_COLORS: Record<ToastType, string> = {
    success: '#22C55E',
    error:   '#EF4444',
    warning: '#F59E0B',
    info:    '#3B82F6',
  };

  protected isExiting(id: string): boolean {
    return this.exitingIds().includes(id);
  }

  protected dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  protected bgColor(type: ToastType): string {
    return ToastComponent.BG_COLORS[type];
  }

  protected iconColor(type: ToastType): string {
    return ToastComponent.ICON_COLORS[type];
  }

}
