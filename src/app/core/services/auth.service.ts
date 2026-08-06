import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS, APP_ROUTES, STORAGE_KEYS } from '../constants/app.constants';
import { UserProfile } from '../interfaces/auth.interface';
import { fetchJson } from '../utils/http.util';
import { LoaderService } from './loader.service';
import { ToastService } from './toast.service';

interface AuthResponseEnvelope<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly code?: string;
  readonly data?: T;
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && (error as Error & { status?: number }).status === 401;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loaderService = inject(LoaderService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  private readonly userSignal = signal<UserProfile | null>(null);

  public readonly currentUser = this.userSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /**
   * The session cookie is HttpOnly, so the only authority on "am I signed in" is the
   * server. This holds the in-flight (or settled) verification so the app shell and
   * every route guard share one round trip per page load instead of one each.
   */
  private sessionCheck: Promise<boolean> | null = null;

  private async authRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { response, result } = await fetchJson(`${this.baseUrl}${endpoint}`, options);
    const payload = result as AuthResponseEnvelope<T>;

    if (!response.ok || !payload.success) {
      throw Object.assign(new Error(payload.message || 'Authentication request failed.'), {
        status: response.status,
        code: payload.code,
      });
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

      return this.startSession(responseData.user);
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

      return this.startSession(responseData.user);
    } finally {
      this.loaderService.hide();
    }
  }

  public async logout(): Promise<void> {
    this.loaderService.show('Leaving Kivora Kitchen...');
    try {
      await this.authRequest<void>(API_ENDPOINTS.AUTH_LOGOUT, { method: 'POST' });
    } catch {
      // Proceed to sign out locally even if backend endpoint is unreachable
    } finally {
      this.clearLocalSession();
      this.sessionCheck = Promise.resolve(false);
      this.loaderService.hide();
    }
  }

  /**
   * Resolves the real session state against the server. Callers share a single
   * request; pass `force` after an action that could have changed the session.
   */
  public checkSession(force = false): Promise<boolean> {
    if (force || !this.sessionCheck) {
      this.sessionCheck = this.verifySession();
    }
    return this.sessionCheck;
  }

  private async verifySession(): Promise<boolean> {
    // Optimistic paint from cache so a returning user doesn't flash the signed-out
    // shell. Never load-bearing — the /me result below is what actually decides.
    this.restoreCachedProfile();

    try {
      const responseData = await this.authRequest<{ user: UserProfile }>(API_ENDPOINTS.AUTH_ME);
      this.setProfile(responseData.user);
      return true;
    } catch (error: unknown) {
      // Only an explicit rejection from the server ends the session. A dropped
      // connection proves nothing, so the cached profile stays put rather than
      // signing someone out because their wifi blipped — the next real API call
      // will 401 and route through handleUnauthorized() if the session is truly gone.
      if (isUnauthorizedError(error)) {
        this.clearLocalSession();
        return false;
      }
      return this.isAuthenticated();
    }
  }

  /**
   * Single exit path for a session the server has rejected mid-flight, so the
   * in-memory signal and the cached copy can never disagree about being signed in.
   */
  public handleUnauthorized(): void {
    this.clearLocalSession();
    this.sessionCheck = Promise.resolve(false);
    this.toast.error('Your session has expired. Please sign in again.', 'Session Expired');
    window.location.href = APP_ROUTES.HOME;
  }

  /**
   * Sends a signed-out visitor to the sign-in page. `returnUrl` is where they
   * land afterwards — pass the action they were interrupted mid-way through.
   */
  public promptLogin(mode: 'login' | 'signup' = 'login', returnUrl?: string): void {
    this.router.navigate([APP_ROUTES.LOGIN], {
      queryParams: {
        ...(mode === 'signup' && { mode }),
        ...(returnUrl && { returnUrl }),
      },
    });
  }

  public markOnboardingCompleted(): void {
    const user = this.userSignal();
    if (user && !user.onboardingCompleted) {
      this.setProfile({ ...user, onboardingCompleted: true });
    }
  }

  private startSession(profile: UserProfile): UserProfile {
    this.setProfile(profile);
    this.sessionCheck = Promise.resolve(true);
    return profile;
  }

  private setProfile(profile: UserProfile): void {
    this.userSignal.set(profile);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
  }

  private restoreCachedProfile(): void {
    const cached = localStorage.getItem(STORAGE_KEYS.USER);
    if (!cached) return;

    try {
      this.userSignal.set(JSON.parse(cached) as UserProfile);
    } catch {
      this.clearLocalSession();
    }
  }

  private clearLocalSession(): void {
    this.userSignal.set(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}
