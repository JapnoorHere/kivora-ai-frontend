export const STORAGE_KEYS = {
  USER: 'kivora_user',
  LANGUAGE: 'kivora_language',
} as const;

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_LOGOUT: '/auth/logout',
  RECIPES_GENERATE: '/recipes/generate',
  RECIPES_LIST: '/recipes',
  recipeById: (id: string): string => `/recipes/${id}`,
  recipeModify: (id: string): string => `/recipes/${id}/modify`,
  FEEDBACK_SUBMIT: '/feedback/submit',
  SETTINGS_AI_GET: '/settings/ai',
  SETTINGS_AI_SAVE_KEY: '/settings/ai/keys',
  settingsAiRemoveKey: (provider: string): string => `/settings/ai/keys/${provider}`,
  SETTINGS_AI_PREFERRED: '/settings/ai/preferred',
} as const;

export const APP_ROUTES = {
  HOME: '/',
  RECENT: '/recent',
  SETTINGS: '/settings',
  recipeIngredients: (id: string): string[] => ['/recipes', id, 'ingredients'],
  recipeSteps: (id: string): string[] => ['/recipes', id, 'steps'],
} as const;

export const MOBILE_BREAKPOINT_PX = 768;
