import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { LoaderComponent } from './components/loader/loader';
import { SidebarComponent } from './components/sidebar/sidebar';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, SidebarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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

  protected async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
