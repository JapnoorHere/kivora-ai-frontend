import { Component, ChangeDetectionStrategy, signal, computed, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DietaryPreference } from '../../core/enums/recipe.enum';

export interface InterviewResult {
  readonly servings: number;
  readonly diet: DietaryPreference;
  readonly exclusions: string;
}

@Component({
  selector: 'app-cooking-interview',
  templateUrl: './cooking-interview.html',
  styleUrl: './cooking-interview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancel()',
  },
})
export class CookingInterviewComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  public readonly recipeName = input.required<string>();
  public readonly recipeCuisine = input<string>('');

  public readonly submitted = output<InterviewResult>();
  public readonly cancelled = output<void>();

  protected readonly step = signal<number>(1);
  protected readonly direction = signal<'forward' | 'backward'>('forward');
  protected readonly servings = signal<number>(2);
  protected readonly diet = signal<DietaryPreference>(DietaryPreference.VEGETARIAN);
  protected readonly exclusions = signal<string>('');

  protected readonly Diet = DietaryPreference;

  protected readonly stepAnimClass = computed(() =>
    `animate-step-${this.direction()}`
  );

  public ngOnInit(): void {
    this.document.body.style.overflow = 'hidden';
  }

  public ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  protected next(): void {
    this.direction.set('forward');
    this.step.update(s => s + 1);
  }

  protected back(): void {
    this.direction.set('backward');
    this.step.update(s => s - 1);
  }

  protected increment(): void {
    this.servings.update(s => Math.min(20, s + 1));
  }

  protected decrement(): void {
    this.servings.update(s => Math.max(1, s - 1));
  }

  protected selectDiet(value: DietaryPreference): void {
    this.diet.set(value);
  }

  protected onExclusionsInput(event: Event): void {
    this.exclusions.set((event.target as HTMLInputElement).value);
  }

  protected submit(): void {
    this.submitted.emit({
      servings: this.servings(),
      diet: this.diet(),
      exclusions: this.exclusions(),
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
