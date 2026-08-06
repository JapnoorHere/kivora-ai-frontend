import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS, APP_ROUTES, STORAGE_KEYS } from '../constants/app.constants';
import { ApiErrorResponse } from '../interfaces/recipe.interface';
import { SavePreferencesRequest, UserPreferences } from '../interfaces/preferences.interface';
import { fetchJson } from '../utils/http.util';
import { ToastService } from './toast.service';

interface ApiEnvelope<T> {
  readonly data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly toast = inject(ToastService);

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { response, result } = await fetchJson(`${this.baseUrl}${endpoint}`, options);

    if (response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      this.toast.error('Your session has expired. Please sign in again.', 'Session Expired');
      window.location.href = APP_ROUTES.HOME;
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errPayload = result as ApiErrorResponse;
      throw Object.assign(new Error(errPayload.message || 'Server request failed.'), { code: errPayload.code });
    }

    const payload = result as ApiEnvelope<T>;
    return payload.data !== undefined ? payload.data : (result as T);
  }

  public getPreferences(): Promise<UserPreferences> {
    return this.request<UserPreferences>(API_ENDPOINTS.USER_PREFERENCES);
  }

  public savePreferences(payload: SavePreferencesRequest): Promise<UserPreferences> {
    return this.request<UserPreferences>(API_ENDPOINTS.USER_PREFERENCES, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}
