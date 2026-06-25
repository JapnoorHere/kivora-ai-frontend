import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private readonly loadingSignal = signal<boolean>(false);
  private readonly messageSignal = signal<string | null>(null);

  public readonly isLoading = this.loadingSignal.asReadonly();
  public readonly message = this.messageSignal.asReadonly();

  public show(message: string | null = null): void {
    this.messageSignal.set(message);
    this.loadingSignal.set(true);
  }

  public hide(): void {
    this.loadingSignal.set(false);
    this.messageSignal.set(null);
  }
}
