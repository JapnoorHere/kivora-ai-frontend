import { Injectable, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/app.constants';
import { LanguageCode } from '../enums/recipe.enum';
import { Recipe } from '../interfaces/recipe.interface';
import { RecipeApiService } from './recipe-api.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeStateService {
  private readonly apiService = inject(RecipeApiService);

  private readonly currentRecipeSignal = signal<Recipe | null>(null);
  private readonly recentRecipesSignal = signal<readonly Recipe[]>([]);
  private readonly currentLanguageSignal = signal<LanguageCode>(LanguageCode.ENGLISH);

  public readonly currentRecipe = this.currentRecipeSignal.asReadonly();
  public readonly recentRecipes = this.recentRecipesSignal.asReadonly();
  public readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  constructor() {
    const cachedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (cachedLanguage) {
      this.currentLanguageSignal.set(cachedLanguage as LanguageCode);
    }
  }

  public setRecipe(recipe: Recipe): void {
    this.currentRecipeSignal.set(recipe);
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
    return recipe;
  }

  public clearRecipe(): void {
    this.currentRecipeSignal.set(null);
  }

  public async loadRecentRecipes(): Promise<void> {
    const recipes = await this.apiService.fetchRecipes();
    this.recentRecipesSignal.set(recipes);
  }

  public setLanguage(lang: LanguageCode): void {
    this.currentLanguageSignal.set(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  }
}
