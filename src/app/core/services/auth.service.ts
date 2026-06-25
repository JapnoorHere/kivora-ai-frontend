import { Injectable, signal, computed, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models/auth.model';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loaderService = inject(LoaderService);
  private readonly baseUrl = environment.apiUrl;

  private readonly userSignal = signal<UserProfile | null>(null);
  
  public readonly currentUser = this.userSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /**
   * Private helper to perform auth requests with credentials.
   */
  private async authRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Exchanges cookies for backend session management
    });

    if (response.status === 401) {
      this.clearLocalSession();
      throw new Error('Unauthorized');
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Authentication request failed.');
    }

    return result.data as T;
  }

  public async login(email: string, password: string): Promise<UserProfile> {
    this.loaderService.show('Entering Kivora Kitchen...');
    try {
      const responseData = await this.authRequest<{ user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const profile = responseData.user;
      this.userSignal.set(profile);
      localStorage.setItem('kivora_user', JSON.stringify(profile));
      return profile;
    } finally {
      this.loaderService.hide();
    }
  }

  public async signup(name: string, email: string, password: string): Promise<UserProfile> {
    this.loaderService.show('Creating your Profile...');
    try {
      const responseData = await this.authRequest<{ user: UserProfile }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const profile = responseData.user;
      this.userSignal.set(profile);
      localStorage.setItem('kivora_user', JSON.stringify(profile));
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
        localStorage.setItem('kivora_user', JSON.stringify(profile));
        this.loaderService.hide();
        resolve(profile);
      }, 1200);
    });
  }

  public async logout(): Promise<void> {
    this.loaderService.show('Leaving Kivora Kitchen...');
    try {
      await this.authRequest<void>('/auth/logout', {
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
    const cached = localStorage.getItem('kivora_user');
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
    localStorage.removeItem('kivora_user');
  }
}
