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
  DIET_MISMATCH_MODIFICATION = 'RECIPE_DIET_MISMATCH_MODIFICATION'
}
