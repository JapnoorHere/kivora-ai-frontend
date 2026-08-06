import { DietaryPreference, LanguageCode } from '../enums/recipe.enum';

export interface UserPreferences {
  readonly onboardingCompleted: boolean;
  readonly dietaryPreference: DietaryPreference | null;
  readonly favoriteCuisines: readonly string[];
  readonly favoriteDishes: readonly string[];
  readonly preferredLanguage: LanguageCode;
}

export interface SavePreferencesRequest {
  readonly dietaryPreference: DietaryPreference;
  readonly favoriteCuisines: readonly string[];
  readonly favoriteDishes: readonly string[];
  readonly preferredLanguage: LanguageCode;
}
