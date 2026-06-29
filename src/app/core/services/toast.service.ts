import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly _exitingIds = signal<string[]>([]);

  public readonly toasts = this._toasts.asReadonly();
  public readonly exitingIds = this._exitingIds.asReadonly();

  public show(message: string, type: ToastType = 'info', title?: string, duration = 4000): void {
    const id = crypto.randomUUID();
    // Cap at 3 visible toasts — oldest is dropped when limit is exceeded
    this._toasts.update(list => [...list.slice(-2), { id, type, message, title, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  public success(message: string, title?: string): void {
    this.show(message, 'success', title, 4000);
  }

  public error(message: string, title?: string): void {
    this.show(message, 'error', title, 5500);
  }

  public warning(message: string, title?: string): void {
    this.show(message, 'warning', title, 4500);
  }

  public info(message: string, title?: string): void {
    this.show(message, 'info', title, 4000);
  }

  public dismiss(id: string): void {
    if (this._exitingIds().includes(id)) return;
    this._exitingIds.update(ids => [...ids, id]);
    setTimeout(() => {
      this._toasts.update(list => list.filter(t => t.id !== id));
      this._exitingIds.update(ids => ids.filter(i => i !== id));
    }, 380);
  }
}
