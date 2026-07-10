import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS, APP_ROUTES, STORAGE_KEYS } from '../constants/app.constants';
import {
  ApiErrorResponse,
  FeedbackRequest,
  Recipe,
  RecipeGenerationRequest,
  RecipeModificationRequest,
} from '../interfaces/recipe.interface';
import { fetchJson } from '../utils/http.util';
import { ToastService } from './toast.service';

interface ApiEnvelope<T> {
  readonly data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class RecipeApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly toast = inject(ToastService);

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { response, result } = await fetchJson(`${this.baseUrl}${endpoint}`, options);

    // Check for token expiration / unauthorized
    if (response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      this.toast.error('Your session has expired. Please sign in again.', 'Session Expired');
      window.location.href = APP_ROUTES.HOME;
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      // Throw structured API error response if available
      const errPayload = result as ApiErrorResponse;
      throw new Error(errPayload.message || 'Server request failed.');
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

  public modifyRecipe(payload: RecipeModificationRequest): Promise<Recipe> {
    return this.request<Recipe>(API_ENDPOINTS.RECIPES_MODIFY, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public submitBugReport(payload: FeedbackRequest): Promise<void> {
    return this.request<void>(API_ENDPOINTS.FEEDBACK_SUBMIT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
