import { Injectable } from '@angular/core';
import { PresetRecipe } from '../interfaces/recipe.interface';

export type CookIntent =
  | { readonly kind: 'search'; readonly query: string }
  | { readonly kind: 'preset'; readonly recipe: PresetRecipe };

/**
 * Holds what a signed-out visitor was about to cook while they detour through
 * /login, so the sign-in lands them back on the action instead of a blank home
 * page. Root-scoped, so it outlives the component that recorded it — and it is
 * consumed exactly once, so a later visit never replays a stale intent.
 */
@Injectable({
  providedIn: 'root',
})
export class CookIntentService {
  private intent: CookIntent | null = null;

  public remember(intent: CookIntent): void {
    this.intent = intent;
  }

  public consume(): CookIntent | null {
    const pending = this.intent;
    this.intent = null;
    return pending;
  }
}
