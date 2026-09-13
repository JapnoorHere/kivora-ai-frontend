import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/app.constants';
import { AiInteractionLogEntry } from '../interfaces/logs.interface';
import { ApiErrorResponse } from '../interfaces/recipe.interface';
import { fetchJson } from '../utils/http.util';
import { AuthService } from './auth.service';

interface ApiEnvelope<T> {
  readonly data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class LogsApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly authService = inject(AuthService);

  private async request<T>(endpoint: string): Promise<T> {
    const { response, result } = await fetchJson(`${this.baseUrl}${endpoint}`);

    if (response.status === 401) {
      this.authService.handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errPayload = result as ApiErrorResponse;
      throw Object.assign(new Error(errPayload.message || 'Server request failed.'), { code: errPayload.code });
    }

    const payload = result as ApiEnvelope<T>;
    return payload.data !== undefined ? payload.data : (result as T);
  }

  public fetchAiInteractions(): Promise<AiInteractionLogEntry[]> {
    return this.request<AiInteractionLogEntry[]>(API_ENDPOINTS.LOGS_AI);
  }
}
