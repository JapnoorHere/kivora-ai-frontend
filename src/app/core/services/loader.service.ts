import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private readonly loadingSignal = signal<boolean>(false);
  private readonly messageSignal = signal<string | null>(null);
  private rotationId: ReturnType<typeof setInterval> | null = null;

  public readonly isLoading = this.loadingSignal.asReadonly();
  public readonly message = this.messageSignal.asReadonly();

  /**
   * Show the overlay. Pass a single string for a static line, or several lines
   * to cycle through them every 3 seconds — used to keep long AI waits from
   * feeling stuck.
   */
  public show(message: string | readonly string[] | null = null): void {
    this.stopRotation();

    const lines: readonly string[] =
      typeof message === 'string' ? [message] : (message ?? []);

    this.messageSignal.set(lines[0] ?? null);
    this.loadingSignal.set(true);

    if (lines.length > 1) {
      let index = 0;
      this.rotationId = setInterval(() => {
        index = (index + 1) % lines.length;
        this.messageSignal.set(lines[index]);
      }, 3000);
    }
  }

  public hide(): void {
    this.stopRotation();
    this.loadingSignal.set(false);
    this.messageSignal.set(null);
  }

  private stopRotation(): void {
    if (this.rotationId !== null) {
      clearInterval(this.rotationId);
      this.rotationId = null;
    }
  }
}
