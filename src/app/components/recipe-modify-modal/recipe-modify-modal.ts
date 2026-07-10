import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LanguageCode } from '../../core/enums/recipe.enum';

type ModifyModalTab = 'modify' | 'translate';

@Component({
  selector: 'app-recipe-modify-modal',
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 select-none animate-fade-in"
      (click)="handleOverlayClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modify-modal-title"
    >
      <div class="relative w-full max-w-sm bg-[#fbfbfa]/95 backdrop-blur-xl border border-white/70 shadow-2xl rounded-3xl p-6 space-y-5 animate-slide-up">

        <h3 id="modify-modal-title" class="text-sm font-extrabold text-slate-800 tracking-tight text-center">
          Update This Recipe
        </h3>

        <!-- Tab selector -->
        <div class="relative flex p-1 bg-slate-900/5 rounded-2xl select-none h-10 items-center">
          <div
            class="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out"
            [style.transform]="tab() === 'modify' ? 'translateX(0)' : 'translateX(100%)'"
          ></div>
          <button
            type="button"
            (click)="tab.set('modify')"
            class="flex-1 text-center text-xs font-black relative z-10 transition-colors duration-300 focus:outline-none cursor-pointer"
            [class.text-slate-800]="tab() === 'modify'"
            [class.text-slate-500]="tab() !== 'modify'"
          >Modify</button>
          <button
            type="button"
            (click)="tab.set('translate')"
            class="flex-1 text-center text-xs font-black relative z-10 transition-colors duration-300 focus:outline-none cursor-pointer"
            [class.text-slate-800]="tab() === 'translate'"
            [class.text-slate-500]="tab() !== 'translate'"
          >Translate</button>
        </div>

        @if (tab() === 'modify') {
          <div class="space-y-2">
            <textarea
              [value]="modificationText()"
              (input)="onModificationTextInput($event)"
              rows="3"
              placeholder="e.g. make it spicier, swap paneer for tofu..."
              class="w-full bg-white/60 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all duration-300 resize-none"
            ></textarea>
          </div>
        } @else {
          <div class="space-y-2">
            @for (lang of languages; track lang.code) {
              <button
                type="button"
                (click)="targetLanguage.set(lang.code)"
                class="w-full py-3 rounded-2xl font-bold text-xs transition-all duration-200 focus:outline-none cursor-pointer border"
                [class.bg-amber-400]="targetLanguage() === lang.code"
                [class.border-amber-400]="targetLanguage() === lang.code"
                [class.text-slate-900]="targetLanguage() === lang.code"
                [class.bg-white/60]="targetLanguage() !== lang.code"
                [class.border-slate-200]="targetLanguage() !== lang.code"
                [class.text-slate-600]="targetLanguage() !== lang.code"
              >{{ lang.label }}</button>
            }
          </div>
        }

        <div class="flex items-center gap-3 pt-1">
          <button
            type="button"
            (click)="cancel.emit()"
            class="flex-1 py-2.5 rounded-full border border-slate-300 hover:bg-slate-900/5 text-slate-700 font-bold text-xs transition-all duration-200 cursor-pointer active:scale-98"
          >Cancel</button>
          <button
            type="button"
            [disabled]="isSubmitting() || !canSubmit()"
            (click)="submit()"
            class="flex-1 py-2.5 rounded-full font-black text-xs tracking-wider uppercase shadow-md transition-all duration-200 cursor-pointer active:scale-98 bg-[#fcd34d] hover:bg-[#fbbf24] text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >{{ isSubmitting() ? 'Working...' : 'Apply' }}</button>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancel.emit()',
  },
})
export class RecipeModifyModalComponent {
  public readonly isSubmitting = input<boolean>(false);

  public readonly modify = output<string>();
  public readonly translate = output<LanguageCode>();
  public readonly cancel = output<void>();

  protected readonly tab = signal<ModifyModalTab>('modify');
  protected readonly modificationText = signal<string>('');
  protected readonly targetLanguage = signal<LanguageCode | null>(null);

  protected readonly languages: ReadonlyArray<{ code: LanguageCode; label: string }> = [
    { code: LanguageCode.ENGLISH, label: 'English' },
    { code: LanguageCode.HINDI, label: 'हिन्दी' },
    { code: LanguageCode.PUNJABI, label: 'ਪੰਜਾਬੀ' },
  ];

  protected onModificationTextInput(event: Event): void {
    this.modificationText.set((event.target as HTMLTextAreaElement).value);
  }

  protected canSubmit(): boolean {
    return this.tab() === 'modify' ? this.modificationText().trim().length > 0 : this.targetLanguage() !== null;
  }

  protected handleOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    if (this.tab() === 'modify') {
      this.modify.emit(this.modificationText().trim());
    } else {
      this.translate.emit(this.targetLanguage()!);
    }
  }
}
