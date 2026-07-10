export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  readonly id: string;
  readonly type: ToastType;
  readonly message: string;
  readonly title?: string;
  readonly duration: number;
}
