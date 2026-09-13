import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RecipePhoto } from '../../../core/interfaces/recipe.interface';

/**
 * The one banner photo for a recipe's finished dish. Shows a real, named
 * credit + link back to Pexels (unlike the small per-ingredient thumbnails,
 * which carry credit data but don't display it — see IngredientThumbComponent)
 * since there's exactly one of these per page and room to do it properly.
 * Falls back to a plain placeholder tile when there's no photo (no key
 * configured, no match found, a lookup error, or an older pre-feature recipe).
 *
 * The photo is shown in full (`object-contain`) rather than cropped to fill
 * the frame — a portrait-ish shot forced edge-to-edge into a wide banner via
 * `object-cover` loses the top/bottom of the actual photo. A blurred,
 * edge-to-edge copy of the same photo sits behind it so any letterboxed
 * space reads as an intentional backdrop rather than a bare colour bar.
 */
@Component({
  selector: 'app-recipe-hero-photo',
  template: `
    <div class="relative w-full aspect-[16/9] rounded-[2rem] overflow-hidden bg-gradient-to-br from-amber-400/15 to-amber-500/10">
      @if (showPhoto()) {
        <img [src]="photo()!.url" alt="" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60" />
        <img
          [src]="photo()!.url"
          [alt]="title()"
          (error)="failed.set(true)"
          class="relative w-full h-full object-contain"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none"></div>
        @if (photo()!.photographerName) {
          <a
            [href]="photo()!.pexelsPhotoPageUrl || 'https://www.pexels.com'"
            target="_blank"
            rel="noopener noreferrer"
            class="absolute bottom-3 right-3 text-[9px] font-bold text-white/90 bg-black/35 backdrop-blur-md px-2.5 py-1 rounded-full hover:bg-black/55 transition-colors duration-200"
          >Photo by {{ photo()!.photographerName }} &middot; via Pexels</a>
        }
      } @else {
        <div class="w-full h-full flex items-center justify-center text-amber-500/45">
          <svg aria-hidden="true" class="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18-3.5V4.5A2.25 2.25 0 015.25 2.25h13.5A2.25 2.25 0 0121 4.5v13.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-2.25z" />
            <circle cx="8.25" cy="9" r="1.25" fill="currentColor" stroke="none" />
          </svg>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeHeroPhotoComponent {
  public readonly title = input.required<string>();
  public readonly photo = input<RecipePhoto | null>(null);

  protected readonly failed = signal<boolean>(false);
  protected readonly showPhoto = computed(() => this.photo() !== null && !this.failed());
}
