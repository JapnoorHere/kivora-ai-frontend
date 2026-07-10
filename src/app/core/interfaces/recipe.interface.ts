import { DietaryPreference, LanguageCode, RecipeDifficulty } from '../enums/recipe.enum';

export interface Ingredient {
  readonly name: string;
  readonly amount: string;
}

export interface RecipeStep {
  readonly stepNumber: number;
  readonly instruction: string;
  readonly timeRequired?: string;
}

export interface NutritionalInfo {
  readonly calories?: number;
  readonly protein?: string;
  readonly carbs?: string;
  readonly fat?: string;
}

export interface Recipe {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly cuisine?: string;
  readonly dietaryPreference: DietaryPreference;
  readonly language: LanguageCode;
  readonly servings: number;
  readonly prepTime: number;
  readonly cookTime: number;
  readonly difficulty: RecipeDifficulty;
  readonly ingredients: readonly Ingredient[];
  readonly instructions: readonly RecipeStep[];
  readonly nutritionalInfo?: NutritionalInfo;
  readonly sourceRecipeId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RecipeGenerationRequest {
  readonly dishName: string;
  readonly cuisine?: string;
  readonly dietaryPreference: DietaryPreference;
  readonly servings: number;
  readonly exclusions?: string;
  readonly language: LanguageCode;
}

export interface RecipeModificationRequest {
  readonly modificationText?: string;
  readonly targetLanguage?: LanguageCode;
}

export interface FeedbackRequest {
  readonly email: string;
  readonly message: string;
}

export interface ApiErrorResponse {
  readonly message: string;
  readonly code: string;
}

export interface PresetRecipe {
  readonly cuisine: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly diet: DietaryPreference;
}
