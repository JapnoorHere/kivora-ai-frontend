import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { DISCOVERY_CATEGORIES } from '../../core/constants/recipe.constants';
import { AuthService } from '../../core/services/auth.service';
import { MagneticDirective } from '../ui/magnetic.directive';
import { RevealDirective } from '../ui/reveal.directive';
import { ScrollParallaxDirective } from '../ui/scroll-parallax.directive';
import { ScrollProgressDirective } from '../ui/scroll-progress.directive';
import { StepTimerComponent } from '../ui/step-timer/step-timer';
import { SteamWispComponent } from '../ui/steam-wisp/steam-wisp';
import { TiltDirective } from '../ui/tilt.directive';

/**
 * Marketing landing experience for logged-out visitors. Rendered by
 * HomeComponent in place of the search-first dashboard when signed out.
 */
@Component({
  selector: 'app-landing',
  imports: [
    RevealDirective,
    TiltDirective,
    MagneticDirective,
    SteamWispComponent,
    ScrollParallaxDirective,
    ScrollProgressDirective,
    StepTimerComponent,
  ],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private readonly authService = inject(AuthService);

  protected readonly cuisines = DISCOVERY_CATEGORIES;
  protected readonly storySection = viewChild<ElementRef<HTMLElement>>('storySection');

  protected startSignup(): void {
    this.authService.authModalMode.set('signup');
    this.authService.isAuthModalOpen.set(true);
  }

  protected startLogin(): void {
    this.authService.authModalMode.set('login');
    this.authService.isAuthModalOpen.set(true);
  }

  protected scrollToStory(): void {
    this.storySection()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
