import { DietaryPreference, LanguageCode } from '../enums/recipe.enum';

export interface LocalizedText {
  readonly [LanguageCode.ENGLISH]: string;
  readonly [LanguageCode.HINDI]: string;
  readonly [LanguageCode.PUNJABI]: string;
}

export interface Ingredient {
  readonly name: LocalizedText;
  readonly quantity: string;
  readonly image: string | null;
}

export interface RecipeStep {
  readonly stepNumber: number;
  readonly instruction: LocalizedText;
  readonly timeRequired: string | null;
  readonly ingredientsUsed: string | null;
}

export interface Recipe {
  readonly id: number;
  readonly uniqueId: string;
  readonly recipeName: LocalizedText;
  readonly ingredients: readonly Ingredient[];
  readonly steps: readonly RecipeStep[];
  readonly totalTime: string;
  readonly createdAt: string;
  readonly lastAccessedAt: string;
  readonly diet?: DietaryPreference;
  readonly cuisine?: string;
  readonly description?: string;
  readonly servings?: number;
}

export interface RecipeGenerationRequest {
  readonly recipeName: string;
  readonly servingsCount: number;
  readonly diet: DietaryPreference;
  readonly cuisine: string;
  readonly healthGoals: string;
  readonly restrictions: string;
  readonly description: string;
}

export interface RecipeModificationRequest {
  readonly originalRecipe: Recipe;
  readonly modificationText: string;
}

export interface FeedbackRequest {
  readonly email: string;
  readonly message: string;
}

export interface ApiErrorResponse {
  readonly message: string;
  readonly reason: string;
}

export interface PresetRecipe {
  readonly cuisine: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly diet: DietaryPreference;
}
