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
  RECIPES_GENERATE: '/recipes/generate',
  RECIPES_MODIFY: '/recipes/modify',
  FEEDBACK_SUBMIT: '/feedback/submit',
} as const;

export const APP_ROUTES = {
  HOME: '/',
  INGREDIENTS: '/ingredients',
  STEPS: '/steps',
  RECENT: '/recent',
} as const;

export const MOBILE_BREAKPOINT_PX = 768;

export const MAX_RECENT_RECIPES = 20;
