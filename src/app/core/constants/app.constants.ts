export const STORAGE_KEYS = {
  USER: 'kivora_user',
  LANGUAGE: 'kivora_language',
  CURRENT_RECIPE: 'kivora_current_recipe',
  RECENT_RECIPES: 'kivora_recent_recipes',
} as const;

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  RECIPES_GENERATE: '/recipes/generate',
  RECIPES_LIST: '/recipes',
  RECIPES_STATS: '/recipes/stats',
  recipeById: (id: string): string => `/recipes/${id}`,
  recipeModify: (id: string): string => `/recipes/${id}/modify`,
  FEEDBACK_SUBMIT: '/feedback/submit',
  SETTINGS_AI_GET: '/settings/ai',
  SETTINGS_AI_SAVE_KEY: '/settings/ai/keys',
  settingsAiRemoveKey: (provider: string): string => `/settings/ai/keys/${provider}`,
  SETTINGS_AI_PREFERRED: '/settings/ai/preferred',
  USER_PREFERENCES: '/user/preferences',
  LOGS_AI: '/logs/ai-interactions',
  LOGS_ERRORS: '/logs/errors',
} as const;

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  RECENT: '/recent',
  SETTINGS: '/settings',
  ACTIVITY: '/activity',
  recipeIngredients: (id: string): string[] => ['/recipes', id, 'ingredients'],
  recipeSteps: (id: string): string[] => ['/recipes', id, 'steps'],
} as const;

export const MOBILE_BREAKPOINT_PX = 768;

// Mirrors the signup rule in the backend's auth.validator.js — keep the two in step
export const PASSWORD_MIN_LENGTH = 8;
