import { Injectable, signal } from '@angular/core';
import { MAX_RECENT_RECIPES, STORAGE_KEYS } from '../constants/app.constants';
import { LanguageCode } from '../enums/recipe.enum';
import { LocalizedText, Recipe } from '../interfaces/recipe.interface';

@Injectable({
  providedIn: 'root',
})
export class RecipeStateService {
  private readonly currentRecipeSignal = signal<Recipe | null>(null);
  private readonly recentRecipesSignal = signal<readonly Recipe[]>([]);
  private readonly currentLanguageSignal = signal<LanguageCode>(LanguageCode.ENGLISH);

  public readonly currentRecipe = this.currentRecipeSignal.asReadonly();
  public readonly recentRecipes = this.recentRecipesSignal.asReadonly();
  public readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  constructor() {
    this.restoreState();
  }

  public restoreState(): void {
    const cachedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (cachedLanguage) {
      this.currentLanguageSignal.set(cachedLanguage as LanguageCode);
    }

    const cachedRecipe = localStorage.getItem(STORAGE_KEYS.CURRENT_RECIPE);
    if (cachedRecipe) {
      try {
        this.currentRecipeSignal.set(JSON.parse(cachedRecipe));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_RECIPE);
      }
    }

    const cachedRecent = localStorage.getItem(STORAGE_KEYS.RECENT_RECIPES);
    if (cachedRecent) {
      try {
        this.recentRecipesSignal.set(JSON.parse(cachedRecent));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.RECENT_RECIPES);
      }
    }
  }

  public setRecipe(recipe: Recipe): void {
    // Generate unique ID: lowercase with hyphens e.g. butter-chicken-nonveg-indian
    const englishName = recipe.recipeName[LanguageCode.ENGLISH] || 'unnamed';
    const diet = recipe.diet || 'nodiet';
    const cuisine = recipe.cuisine || 'nocuisine';
    const uniqueId = `${englishName}-${diet}-${cuisine}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    // Create a modified recipe object with generated unique ID
    const updatedRecipe: Recipe = {
      ...recipe,
      uniqueId,
      lastAccessedAt: new Date().toISOString(),
    };

    this.currentRecipeSignal.set(updatedRecipe);
    localStorage.setItem(STORAGE_KEYS.CURRENT_RECIPE, JSON.stringify(updatedRecipe));

    // Update history list
    const currentList = [...this.recentRecipesSignal()];
    const existingIndex = currentList.findIndex((r) => r.uniqueId === uniqueId);

    if (existingIndex !== -1) {
      // Replace with updated version
      currentList[existingIndex] = updatedRecipe;
    } else {
      // Append to the front of history
      currentList.unshift(updatedRecipe);
    }

    // Cap history at MAX_RECENT_RECIPES entries
    const cappedList = currentList.slice(0, MAX_RECENT_RECIPES);
    this.recentRecipesSignal.set(cappedList);
    localStorage.setItem(STORAGE_KEYS.RECENT_RECIPES, JSON.stringify(cappedList));
  }

  public clearRecipe(): void {
    this.currentRecipeSignal.set(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_RECIPE);
  }

  public removeRecentRecipe(id: number): void {
    const updatedList = this.recentRecipesSignal().filter((r) => r.id !== id);
    this.recentRecipesSignal.set(updatedList);
    localStorage.setItem(STORAGE_KEYS.RECENT_RECIPES, JSON.stringify(updatedList));
  }

  public clearAllRecent(): void {
    this.recentRecipesSignal.set([]);
    localStorage.removeItem(STORAGE_KEYS.RECENT_RECIPES);
  }

  public setLanguage(lang: LanguageCode): void {
    this.currentLanguageSignal.set(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  }

  public selectLocalizedText(text: LocalizedText | string | null | undefined): string {
    if (!text) {
      return '';
    }
    if (typeof text === 'string') {
      return text;
    }
    const currentLang = this.currentLanguageSignal();
    return text[currentLang] || text[LanguageCode.ENGLISH] || '';
  }
}
