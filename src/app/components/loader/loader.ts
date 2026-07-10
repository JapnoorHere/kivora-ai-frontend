import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  template: `
    @if (isLoading()) {
      <div
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm select-none scroll-lock animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Loading content"
      >
        <!-- Outer Loader Container -->
        <div class="relative w-44 h-44 flex items-center justify-center">
          <!-- Ambient Liquid Glass glow ring -->
          <div class="absolute inset-0 rounded-full border border-amber-500/10 bg-gradient-to-tr from-[#fcd34d]/10 to-[#fbbf24]/10 shadow-2xl animate-pulse"></div>

          <!-- Placeholder ID for Lottie View -->
          <div id="lottie-view" class="relative w-28 h-28 flex items-center justify-center text-amber-500 font-bold text-lg select-none">

            <!-- Temporary animated spinner SVG -->
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="w-14 h-14 animate-spin text-amber-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707-.707m0-12.728l.707.707m11.314 11.314l.707-.707" />
            </svg>

          </div>
        </div>

        <!-- Dynamic status text updates -->
        @if (message(); as text) {
          <p class="mt-8 text-xs font-black text-slate-800 tracking-widest uppercase animate-pulse px-6 text-center max-w-sm leading-relaxed">
            {{ text }}
          </p>
        }
      </div>
    }
  `,
  styles: `
    .scroll-lock {
      overscroll-behavior: contain;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-fade-in {
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `,
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
