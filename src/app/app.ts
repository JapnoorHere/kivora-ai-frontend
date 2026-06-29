import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { LoaderComponent } from './components/loader/loader';
import { DockComponent } from './components/dock/dock';
import { FooterComponent } from './components/footer/footer';
import { AuthModalComponent } from './components/auth-modal/auth-modal';
import { ToastComponent } from './components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, DockComponent, FooterComponent, AuthModalComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
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

  protected readonly title = signal('kivora-ai-frontend');

  public async ngOnInit(): Promise<void> {
    await this.authService.checkSession();
  }

  protected closeAuthModal(): void {
    this.authService.isAuthModalOpen.set(false);
  }
}
