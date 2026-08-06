import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthModalComponent } from './components/auth-modal/auth-modal';
import { DockComponent } from './components/dock/dock';
import { FooterComponent } from './components/footer/footer';
import { LoaderComponent } from './components/loader/loader';
import { OnboardingPreferencesComponent } from './components/onboarding-preferences/onboarding-preferences';
import { ToastComponent } from './components/toast/toast';
import { APP_ROUTES } from './core/constants/app.constants';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, DockComponent, FooterComponent, AuthModalComponent, ToastComponent, OnboardingPreferencesComponent],
  template: `
    @if (!isLoginRoute()) {
      <div class="flex min-h-screen relative bg-[#fbfbfa]">

        @if (!isLandingView()) {
          <app-dock />
        }

        <div class="flex-grow flex flex-col min-h-screen min-w-0" [class.md:pl-60]="!isLandingView()">
          <main class="relative flex-grow bg-linear-to-b from-[#fbfbfa] via-[#f7f5f0] to-[#f4eedb] text-slate-900 flex flex-col justify-between">
            <div class="flex-grow" [class.pb-20]="!isLandingView()" [class.md:pb-0]="!isLandingView()">
              <router-outlet />
            </div>
            <app-footer />
          </main>
        </div>

      </div>
    } @else {
      <main class="relative min-h-screen bg-slate-950 text-slate-900">
        <router-outlet />
      </main>
    }

    <app-loader />
    <app-toast />

    @if (authService.isAuthModalOpen()) {
      <app-auth-modal (close)="closeAuthModal()" (authSuccess)="closeAuthModal()" />
    }

    @if (showOnboarding()) {
      <app-onboarding-preferences (completed)="showOnboarding.set(false)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly routerUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects || event.url)
    ),
    { initialValue: '/' }
  );

  protected readonly isLoginRoute = computed(() => {
    return this.routerUrl().includes('/login');
  });

  /**
   * The marketing landing page (HomeComponent's signed-out branch) is a
   * self-contained page with its own navigation — the dock has nothing to
   * offer a visitor who isn't signed in yet.
   */
  protected readonly isLandingView = computed(() => {
    const path = this.routerUrl().split(/[?#]/)[0];
    return !this.authService.isAuthenticated() && path === APP_ROUTES.HOME;
  });

  protected readonly title = signal('kivora-ai-frontend');
  protected readonly showOnboarding = signal<boolean>(false);

  public async ngOnInit(): Promise<void> {
    await this.authService.checkSession();
  }

  protected closeAuthModal(): void {
    this.authService.isAuthModalOpen.set(false);
    if (this.authService.currentUser()?.onboardingCompleted === false) {
      this.showOnboarding.set(true);
    }
  }
}
