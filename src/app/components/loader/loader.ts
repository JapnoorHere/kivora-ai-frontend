import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.html',
  styleUrl: './loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {
  private readonly loaderService = inject(LoaderService);
  private readonly document = inject(DOCUMENT);

  protected readonly isLoading = this.loaderService.isLoading;
  protected readonly message = this.loaderService.message;

  constructor() {
    // Add overflow-hidden to body to block scroll when loading
    effect(() => {
      const active = this.isLoading();
      const body = this.document.body;
      if (active) {
        body.classList.add('overflow-hidden');
      } else {
        body.classList.remove('overflow-hidden');
      }
    });
  }
}
