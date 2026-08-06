import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/app.constants';
import { UserProfile } from '../interfaces/auth.interface';
import { fetchJson } from '../utils/http.util';
import { LoaderService } from './loader.service';

interface AuthResponseEnvelope<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loaderService = inject(LoaderService);
  private readonly baseUrl = environment.apiUrl;

  private readonly userSignal = signal<UserProfile | null>(null);
  
  public readonly currentUser = this.userSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.userSignal() !== null);
  public readonly isAuthModalOpen = signal<boolean>(false);
  public readonly authModalMode = signal<'login' | 'signup'>('login');

  /**
   * Private helper to perform auth requests with credentials.
   */
  private async authRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { response, result } = await fetchJson(`${this.baseUrl}${endpoint}`, options);

    if (response.status === 401) {
      this.clearLocalSession();
      throw new Error('Unauthorized');
    }

    const payload = result as AuthResponseEnvelope<T>;

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Authentication request failed.');
    }

    return payload.data as T;
  }

  public async login(email: string, password: string): Promise<UserProfile> {
    this.loaderService.show('Entering Kivora Kitchen...');
    try {
      const responseData = await this.authRequest<{ user: UserProfile }>(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const profile = responseData.user;
      this.userSignal.set(profile);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      return profile;
    } finally {
      this.loaderService.hide();
    }
  }

  public async signup(name: string, email: string, password: string): Promise<UserProfile> {
    this.loaderService.show('Creating your Profile...');
    try {
      const responseData = await this.authRequest<{ user: UserProfile }>(API_ENDPOINTS.AUTH_SIGNUP, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const profile = responseData.user;
      this.userSignal.set(profile);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      return profile;
    } finally {
      this.loaderService.hide();
    }
  }

  public async loginWithGoogle(): Promise<UserProfile> {
    this.loaderService.show('Connecting to Google Chef...');
    return new Promise((resolve) => {
      // Simulate Google OAuth popup
      setTimeout(() => {
        const profile: UserProfile = {
          email: 'google.chef@kivora.ai',
          name: 'Google Chef',
          photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
        };
        this.userSignal.set(profile);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
        this.loaderService.hide();
        resolve(profile);
      }, 1200);
    });
  }

  public async logout(): Promise<void> {
    this.loaderService.show('Leaving Kivora Kitchen...');
    try {
      await this.authRequest<void>(API_ENDPOINTS.AUTH_LOGOUT, {
        method: 'POST',
      });
    } catch {
      // Proceed to sign out locally even if backend endpoint is unreachable
    } finally {
      this.clearLocalSession();
      this.loaderService.hide();
    }
  }

  public async checkSession(): Promise<boolean> {
    // Local-only verification for cookie-based setups without a profile /me check endpoint
    const cached = localStorage.getItem(STORAGE_KEYS.USER);
    if (cached) {
      try {
        const user: UserProfile = JSON.parse(cached);
        this.userSignal.set(user);
        return true;
      } catch {
        this.clearLocalSession();
        return false;
      }
    }
    return false;
  }

  private clearLocalSession(): void {
    this.userSignal.set(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}
