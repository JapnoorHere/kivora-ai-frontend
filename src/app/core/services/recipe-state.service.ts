import { Injectable, computed, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/app.constants';
import { LanguageCode } from '../enums/recipe.enum';
import { Recipe } from '../interfaces/recipe.interface';
import { RecipeApiService } from './recipe-api.service';

const RECENT_PAGE_SIZE = 24;

@Injectable({
  providedIn: 'root',
})
export class RecipeStateService {
  private readonly apiService = inject(RecipeApiService);

  private readonly currentRecipeSignal = signal<Recipe | null>(null);
  private readonly recentRecipesSignal = signal<readonly Recipe[]>([]);
  private readonly recentTotalSignal = signal<number>(0);
  private readonly recentPageSignal = signal<number>(0);
  private readonly currentLanguageSignal = signal<LanguageCode>(LanguageCode.ENGLISH);

  public readonly currentRecipe = this.currentRecipeSignal.asReadonly();
  public readonly recentRecipes = this.recentRecipesSignal.asReadonly();
  public readonly recentTotal = this.recentTotalSignal.asReadonly();
  public readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  /** More pages are available on the server than are currently loaded. */
  public readonly hasMoreRecent = computed(
    () => this.recentRecipesSignal().length < this.recentTotalSignal(),
  );

  constructor() {
    this.restoreState();
  }

  /**
   * Rehydrates from localStorage so a hard refresh on a recipe page keeps the
   * active recipe, the history, and the dock's recipe links instead of blanking
   * until the next navigation.
   */
  private restoreState(): void {
    const cachedLanguage = this.readRaw(STORAGE_KEYS.LANGUAGE);
    if (cachedLanguage) {
      this.currentLanguageSignal.set(cachedLanguage as LanguageCode);
    }

    const cachedRecipe = this.readJson<Recipe>(STORAGE_KEYS.CURRENT_RECIPE);
    if (cachedRecipe) {
      this.currentRecipeSignal.set(cachedRecipe);
    }

    const cachedRecent = this.readJson<Recipe[]>(STORAGE_KEYS.RECENT_RECIPES);
    if (Array.isArray(cachedRecent)) {
      this.recentRecipesSignal.set(cachedRecent);
      this.recentTotalSignal.set(cachedRecent.length);
    }
  }

  public setRecipe(recipe: Recipe): void {
    this.currentRecipeSignal.set(recipe);
    this.writeJson(STORAGE_KEYS.CURRENT_RECIPE, recipe);
  }

  // Fast path: reuse the in-memory recipe right after generate/modify.
  // Falls back to the backend for refresh, deep links, and navigating in from Recent.
  public async resolveRecipe(id: string): Promise<Recipe> {
    const cached = this.currentRecipeSignal();
    if (cached?.id === id) {
      return cached;
    }
    const recipe = await this.apiService.fetchRecipeById(id);
    this.currentRecipeSignal.set(recipe);
    this.writeJson(STORAGE_KEYS.CURRENT_RECIPE, recipe);
    return recipe;
  }

  public clearRecipe(): void {
    this.currentRecipeSignal.set(null);
    this.removeRaw(STORAGE_KEYS.CURRENT_RECIPE);
  }

  /** Loads a page of history. Page 1 replaces the list; later pages append. */
  public async loadRecentRecipes(page = 1): Promise<void> {
    const result = await this.apiService.fetchRecipes(page, RECENT_PAGE_SIZE);
    this.recentRecipesSignal.update((current) =>
      result.page > 1 ? [...current, ...result.items] : [...result.items],
    );
    this.recentTotalSignal.set(result.total);
    this.recentPageSignal.set(result.page);
    this.writeJson(STORAGE_KEYS.RECENT_RECIPES, this.recentRecipesSignal());
  }

  public loadMoreRecent(): Promise<void> {
    return this.loadRecentRecipes(this.recentPageSignal() + 1);
  }

  /** Deletes one recipe on the server, then drops it from local state. */
  public async removeRecentRecipe(id: string): Promise<void> {
    await this.apiService.deleteRecipe(id);
    this.recentRecipesSignal.update((list) => list.filter((r) => r.id !== id));
    this.recentTotalSignal.update((total) => Math.max(0, total - 1));
    this.writeJson(STORAGE_KEYS.RECENT_RECIPES, this.recentRecipesSignal());
    if (this.currentRecipeSignal()?.id === id) {
      this.clearRecipe();
    }
  }

  /** Wipes the user's entire history on the server and locally. */
  public async clearAllRecent(): Promise<void> {
    await this.apiService.clearRecipes();
    this.recentRecipesSignal.set([]);
    this.recentTotalSignal.set(0);
    this.recentPageSignal.set(0);
    this.removeRaw(STORAGE_KEYS.RECENT_RECIPES);
    this.clearRecipe();
  }

  /** Wipes all recipe state locally — used on sign-out so nothing leaks to the next user. */
  public clearAll(): void {
    this.currentRecipeSignal.set(null);
    this.recentRecipesSignal.set([]);
    this.recentTotalSignal.set(0);
    this.recentPageSignal.set(0);
    this.removeRaw(STORAGE_KEYS.CURRENT_RECIPE);
    this.removeRaw(STORAGE_KEYS.RECENT_RECIPES);
  }

  public setLanguage(lang: LanguageCode): void {
    this.currentLanguageSignal.set(lang);
    this.writeRaw(STORAGE_KEYS.LANGUAGE, lang);
  }

  // --- storage helpers: localStorage can throw (private mode, disabled) ---

  private readRaw(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private readJson<T>(key: string): T | null {
    const raw = this.readRaw(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private writeRaw(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage disabled — in-memory state still works.
    }
  }

  private writeJson(key: string, value: unknown): void {
    this.writeRaw(key, JSON.stringify(value));
  }

  private removeRaw(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to do.
    }
  }
}
