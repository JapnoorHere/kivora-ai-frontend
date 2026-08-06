import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/app.constants';
import { AiProvider } from '../enums/recipe.enum';
import { ApiErrorResponse } from '../interfaces/recipe.interface';
import { AiSettings } from '../interfaces/settings.interface';
import { fetchJson } from '../utils/http.util';
import { AuthService } from './auth.service';

interface ApiEnvelope<T> {
  readonly data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly authService = inject(AuthService);

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { response, result } = await fetchJson(`${this.baseUrl}${endpoint}`, options);

    if (response.status === 401) {
      this.authService.handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errPayload = result as ApiErrorResponse;
      throw Object.assign(new Error(errPayload.message || 'Server request failed.'), { code: errPayload.code });
    }

    const payload = result as ApiEnvelope<T>;
    return (payload.data !== undefined ? payload.data : (result as T));
  }

  public getAiSettings(): Promise<AiSettings> {
    return this.request<AiSettings>(API_ENDPOINTS.SETTINGS_AI_GET);
  }

  public saveApiKey(provider: AiProvider, apiKey: string): Promise<AiSettings> {
    return this.request<AiSettings>(API_ENDPOINTS.SETTINGS_AI_SAVE_KEY, {
      method: 'POST',
      body: JSON.stringify({ provider, apiKey }),
    });
  }

  public removeApiKey(provider: AiProvider): Promise<AiSettings> {
    return this.request<AiSettings>(API_ENDPOINTS.settingsAiRemoveKey(provider), {
      method: 'DELETE',
    });
  }

  public setPreferredProvider(provider: AiProvider): Promise<AiSettings> {
    return this.request<AiSettings>(API_ENDPOINTS.SETTINGS_AI_PREFERRED, {
      method: 'PATCH',
      body: JSON.stringify({ provider }),
    });
  }
}
