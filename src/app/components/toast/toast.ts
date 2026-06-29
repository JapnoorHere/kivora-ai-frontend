import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { ToastType } from '../../core/models/toast.model';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);

  protected readonly toasts = this.toastService.toasts;
  protected readonly exitingIds = this.toastService.exitingIds;

  private static readonly CARD_COLORS: Record<ToastType, string> = {
    success: '#38A169',
    error:   '#E53E3E',
    warning: '#DD6B20',
    info:    '#3182CE',
  };


  protected isExiting(id: string): boolean {
    return this.exitingIds().includes(id);
  }

  protected dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  protected cardColor(type: ToastType): string {
    return ToastComponent.CARD_COLORS[type];
  }

}
