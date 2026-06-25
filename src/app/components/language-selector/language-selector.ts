import { Component, ChangeDetectionStrategy, signal, inject, ElementRef } from '@angular/core';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { LanguageCode } from '../../core/enums/recipe.enum';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelector {
  private readonly stateService = inject(RecipeStateService);
  private readonly elementRef = inject(ElementRef);

  protected readonly currentLanguage = this.stateService.currentLanguage;
  protected readonly isOpen = signal<boolean>(false);

  protected readonly languages = [
    { code: LanguageCode.ENGLISH, label: 'English' },
    { code: LanguageCode.HINDI, label: 'हिन्दी' },
    { code: LanguageCode.PUNJABI, label: 'ਪੰਜਾਬੀ' },
  ];

  protected toggleDropdown(): void {
    this.isOpen.update((v) => !v);
  }

  protected selectLanguage(code: LanguageCode): void {
    this.stateService.setLanguage(code);
    this.isOpen.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    // Close the dropdown if clicking outside of the element
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
