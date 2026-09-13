import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal } from '@angular/core';

type TimerState = 'idle' | 'running' | 'paused' | 'done';

/**
 * Per-step cooking timer. A duration > 0 gets a circular countdown ring with
 * Start/Pause/Resume on the primary button and a separate Reset; a step with
 * no duration (a passive wait, e.g. "let it rest") gets a plain message
 * instead — there is nothing to count down.
 *
 * Purely local UI state; no persistence, since it resets whenever the active
 * step (and therefore `totalSeconds`) changes.
 */
@Component({
  selector: 'app-step-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalSeconds() > 0) {
      <div class="flex items-center gap-2.5 shrink-0">
        <div class="relative w-16 h-16 shrink-0">
          <svg class="timer-ring absolute inset-0 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(15,23,42,0.08)" stroke-width="5" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              [attr.stroke]="state() === 'done' ? '#10b981' : '#fbbf24'"
              stroke-width="5"
              stroke-linecap="round"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="dashOffset()"
            />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700 tabular-nums">
            @if (state() === 'done') {
              ✓
            } @else {
              {{ display() }}
            }
          </span>
        </div>

        <div class="flex flex-col gap-1.5">
          <button
            type="button"
            (click)="onPrimaryClick()"
            [attr.aria-label]="primaryLabel()"
            class="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 flex items-center justify-center transition-colors duration-200 cursor-pointer focus:outline-none"
          >
            @if (state() === 'running') {
              <svg aria-hidden="true" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="4" width="5" height="16" rx="1" />
                <rect x="14" y="4" width="5" height="16" rx="1" />
              </svg>
            } @else {
              <svg aria-hidden="true" class="w-3 h-3 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            }
          </button>
          <button
            type="button"
            (click)="reset()"
            aria-label="Reset timer"
            class="w-7 h-7 rounded-full border border-slate-200 bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors duration-200 cursor-pointer focus:outline-none"
          >
            <svg aria-hidden="true" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    } @else {
      <span class="text-[10px] font-bold text-slate-500 bg-white/60 backdrop-blur-md border border-slate-200/70 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
        <svg aria-hidden="true" class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Proceed when ready
      </span>
    }
  `,
})
export class StepTimerComponent implements OnDestroy {
  public readonly totalSeconds = input.required<number>();

  protected readonly circumference = 2 * Math.PI * 34;
  protected readonly remaining = signal<number>(0);
  protected readonly state = signal<TimerState>('idle');

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      // Resets the ring whenever a new step (with a new duration) is shown.
      this.clearInterval();
      this.remaining.set(this.totalSeconds());
      this.state.set('idle');
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

  protected primaryLabel(): string {
    switch (this.state()) {
      case 'running':
        return 'Pause timer';
      case 'paused':
        return 'Resume timer';
      case 'done':
        return 'Restart timer';
      default:
        return 'Start timer';
    }
  }

  protected onPrimaryClick(): void {
    switch (this.state()) {
      case 'idle':
      case 'paused':
        this.start();
        break;
      case 'running':
        this.pause();
        break;
      case 'done':
        this.remaining.set(this.totalSeconds());
        this.start();
        break;
    }
  }

  private start(): void {
    if (this.state() === 'running') return;
    this.state.set('running');
    this.intervalId = setInterval(() => {
      this.remaining.update((secondsLeft) => {
        if (secondsLeft <= 1) {
          this.clearInterval();
          this.state.set('done');
          return 0;
        }
        return secondsLeft - 1;
      });
    }, 1000);
  }

  private pause(): void {
    this.clearInterval();
    this.state.set('paused');
  }

  /** Stops and returns to the full duration, ready to start again. */
  protected reset(): void {
    this.clearInterval();
    this.remaining.set(this.totalSeconds());
    this.state.set('idle');
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public ngOnDestroy(): void {
    this.clearInterval();
  }
}
