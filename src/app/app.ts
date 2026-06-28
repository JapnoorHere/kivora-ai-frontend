import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { LoaderComponent } from './components/loader/loader';
import { SidebarComponent } from './components/sidebar/sidebar';
import { FooterComponent } from './components/footer/footer';
import { AuthModalComponent } from './components/auth-modal/auth-modal';
import { NgOptimizedImage } from '@angular/common';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, SidebarComponent, FooterComponent, AuthModalComponent, NgOptimizedImage, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Convert router events into a clean, reactive URL signal
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

  protected readonly title = signal('kivora-ai-frontend');
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isMobileMenuOpen = signal<boolean>(false);

  public async ngOnInit(): Promise<void> {
    await this.authService.checkSession();
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected readonly isLogoutConfirmOpen = signal<boolean>(false);

  protected triggerLogoutConfirm(): void {
    this.isLogoutConfirmOpen.set(true);
  }

  protected cancelLogout(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  protected async confirmLogout(): Promise<void> {
    this.isLogoutConfirmOpen.set(false);
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
