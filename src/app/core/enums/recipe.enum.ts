export enum LanguageCode {
  ENGLISH = 'en',
  HINDI = 'hi',
  PUNJABI = 'pa'
}

export enum DietaryPreference {
  VEGETARIAN = 'veg',
  NON_VEGETARIAN = 'nonveg',
  VEGAN = 'vegan'
}

export enum RecipeDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

// Values match backend ERROR_CODES exactly (src/constants/messages.js)
export enum ApiErrorCode {
  INVALID_DISH = 'RECIPE_INVALID_DISH',
  DIET_MISMATCH = 'RECIPE_DIET_MISMATCH',
  DIET_MISMATCH_MODIFICATION = 'RECIPE_DIET_MISMATCH_MODIFICATION',
  FREE_LIMIT_REACHED = 'RECIPE_FREE_LIMIT_REACHED',
  SETTINGS_INVALID_API_KEY = 'SETTINGS_INVALID_API_KEY',
  SETTINGS_PROVIDER_NOT_CONNECTED = 'SETTINGS_PROVIDER_NOT_CONNECTED'
}

// Values match backend's provider enum exactly ('gemini' | 'groq')
export enum AiProvider {
  GEMINI = 'gemini',
  GROQ = 'groq'
}
