import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/app.constants';
import {
  ApiErrorResponse,
  FeedbackRequest,
  Recipe,
  RecipeGenerationRequest,
  RecipeModificationRequest,
} from '../interfaces/recipe.interface';
import { fetchJson } from '../utils/http.util';
import { AuthService } from './auth.service';

interface ApiEnvelope<T> {
  readonly data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class RecipeApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly authService = inject(AuthService);

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { response, result } = await fetchJson(`${this.baseUrl}${endpoint}`, options);

    // Check for token expiration / unauthorized
    if (response.status === 401) {
      this.authService.handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      // Throw structured API error response if available
      const errPayload = result as ApiErrorResponse;
      throw Object.assign(new Error(errPayload.message || 'Server request failed.'), { code: errPayload.code });
    }

    // Adapt to standard server response formatting
    const payload = result as ApiEnvelope<T>;
    return (payload.data !== undefined ? payload.data : (result as T));
  }

  public generateRecipe(payload: RecipeGenerationRequest): Promise<Recipe> {
    return this.request<Recipe>(API_ENDPOINTS.RECIPES_GENERATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public modifyRecipe(id: string, payload: RecipeModificationRequest): Promise<Recipe> {
    return this.request<Recipe>(API_ENDPOINTS.recipeModify(id), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public fetchRecipes(): Promise<Recipe[]> {
    return this.request<Recipe[]>(API_ENDPOINTS.RECIPES_LIST);
  }

  public fetchRecipeById(id: string): Promise<Recipe> {
    return this.request<Recipe>(API_ENDPOINTS.recipeById(id));
  }

  public submitBugReport(payload: FeedbackRequest): Promise<void> {
    return this.request<void>(API_ENDPOINTS.FEEDBACK_SUBMIT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
