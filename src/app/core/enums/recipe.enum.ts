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

export enum ApiErrorReason {
  NONSENSICAL_INPUT = 'NONSENSICAL_INPUT',
  DIET_MISMATCH = 'DIET_MISMATCH',
  DIET_MISMATCH_MODIFICATION = 'DIET_MISMATCH_MODIFICATION'
}
