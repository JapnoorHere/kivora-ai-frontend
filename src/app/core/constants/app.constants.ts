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
} as const;

export const APP_ROUTES = {
  HOME: '/',
  RECENT: '/recent',
  recipeIngredients: (id: string): string[] => ['/recipes', id, 'ingredients'],
  recipeSteps: (id: string): string[] => ['/recipes', id, 'steps'],
} as const;

export const MOBILE_BREAKPOINT_PX = 768;
