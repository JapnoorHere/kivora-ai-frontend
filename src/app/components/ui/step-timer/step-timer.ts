import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal } from '@angular/core';

/**
 * Small circular countdown ring for a single cooking step — click to start,
 * click again to pause. Purely local UI state; no persistence needed since
 * it resets whenever the active step changes.
 */
@Component({
  selector: 'app-step-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle()"
      class="relative w-16 h-16 shrink-0 rounded-full flex items-center justify-center cursor-pointer focus:outline-none"
      [attr.aria-label]="isRunning() ? 'Pause timer' : 'Start timer'"
    >
      <svg class="timer-ring absolute inset-0 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(15,23,42,0.08)" stroke-width="5" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          [attr.stroke]="isDone() ? '#10b981' : '#fbbf24'"
          stroke-width="5"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset()"
        />
      </svg>
      <span class="relative z-10 text-[10px] font-black text-slate-700 tabular-nums">
        @if (isDone()) {
          ✓
        } @else {
          {{ display() }}
        }
      </span>
    </button>
  `,
})
export class StepTimerComponent implements OnDestroy {
  public readonly totalSeconds = input.required<number>();

  protected readonly circumference = 2 * Math.PI * 34;
  protected readonly remaining = signal<number>(0);
  protected readonly isRunning = signal<boolean>(false);
  protected readonly isDone = signal<boolean>(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      // Resets the ring whenever a new step (with a new duration) is shown.
      this.stop();
      this.remaining.set(this.totalSeconds());
      this.isRunning.set(false);
      this.isDone.set(false);
    });
  }

  protected readonly display = computed(() => {
    const totalRemaining = this.remaining();
    const minutes = Math.floor(totalRemaining / 60);
    const seconds = totalRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  protected readonly dashOffset = computed(() => {
    const total = this.totalSeconds();
    if (total <= 0) return this.circumference;
    const fraction = this.remaining() / total;
    return this.circumference * (1 - fraction);
  });

  protected toggle(): void {
    if (this.isDone()) {
      this.remaining.set(this.totalSeconds());
      this.isDone.set(false);
    }

    if (this.isRunning()) {
      this.stop();
      this.isRunning.set(false);
    } else {
      this.isRunning.set(true);
      this.intervalId = setInterval(() => {
        this.remaining.update((secondsLeft) => {
          if (secondsLeft <= 1) {
            this.stop();
            this.isRunning.set(false);
            this.isDone.set(true);
            return 0;
          }
          return secondsLeft - 1;
        });
      }, 1000);
    }
  }

  private stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public ngOnDestroy(): void {
    this.stop();
  }
}
