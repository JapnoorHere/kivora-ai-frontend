import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/app.constants';
import {
  ApiErrorResponse,
  FeedbackRequest,
  PaginatedRecipes,
  Recipe,
  RecipeGenerationRequest,
  RecipeModificationRequest,
  RecipeStats,
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

  public fetchRecipes(page = 1, limit = 20): Promise<PaginatedRecipes> {
    return this.request<PaginatedRecipes>(`${API_ENDPOINTS.RECIPES_LIST}?page=${page}&limit=${limit}`);
  }

  public fetchRecipeStats(): Promise<RecipeStats> {
    return this.request<RecipeStats>(API_ENDPOINTS.RECIPES_STATS);
  }

  public fetchRecipeById(id: string): Promise<Recipe> {
    return this.request<Recipe>(API_ENDPOINTS.recipeById(id));
  }

  public deleteRecipe(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>(API_ENDPOINTS.recipeById(id), { method: 'DELETE' });
  }

  public clearRecipes(): Promise<{ deletedCount: number }> {
    return this.request<{ deletedCount: number }>(API_ENDPOINTS.RECIPES_LIST, { method: 'DELETE' });
  }

  public submitBugReport(payload: FeedbackRequest): Promise<void> {
    return this.request<void>(API_ENDPOINTS.FEEDBACK_SUBMIT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
