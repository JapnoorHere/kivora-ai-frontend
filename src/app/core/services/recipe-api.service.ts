import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Recipe,
  RecipeGenerationRequest,
  RecipeModificationRequest,
  FeedbackRequest,
  ApiErrorResponse,
} from '../models/recipe.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly toast = inject(ToastService);

  /**
   * Universal HTTP request wrapper using native Promise-based fetch.
   * Enforces cross-origin cookie sharing via credentials: 'include'.
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Automatically passes HttpOnly cookies to cross-origin endpoints
    });

    // Check for token expiration / unauthorized
    if (response.status === 401) {
      localStorage.removeItem('kivora_user');
      this.toast.error('Your session has expired. Please sign in again.', 'Session Expired');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    const result = await response.json();

    if (!response.ok) {
      // Throw structured API error response if available
      const errPayload = result as ApiErrorResponse;
      throw new Error(errPayload.message || 'Server request failed.');
    }

    // Adapt to standard server response formatting
    return (result.data !== undefined ? result.data : result) as T;
  }

  public generateRecipe(payload: RecipeGenerationRequest): Promise<Recipe> {
    return this.request<Recipe>('/recipes/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public modifyRecipe(payload: RecipeModificationRequest): Promise<Recipe> {
    return this.request<Recipe>('/recipes/modify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public submitBugReport(payload: FeedbackRequest): Promise<void> {
    return this.request<void>('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
