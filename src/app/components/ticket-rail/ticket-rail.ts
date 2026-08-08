import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MagneticDirective } from '../ui/magnetic.directive';
import { ScrollSceneDirective } from '../ui/scroll-scene.directive';
import { TicketDish, ticketsForDay } from './ticket-rail.data';

interface Ticket extends TicketDish {
  readonly time: string;
  /** Point in the scene at which this ticket clips on. */
  readonly at: number;
  /** Degrees of hang, so the rail isn't a row of perfectly level paper. */
  readonly tilt: number;
}

/** Service times and hang angles, by position on the rail. */
const SERVICE_TIMES = ['19:04', '19:09', '19:13', '19:18', '19:24'];
const HANG_ANGLES = [-2.2, 1.6, -1.4, 2.4, -1.8];

/**
 * The pass.
 *
 * In a working kitchen, orders print as tickets and get clipped to a rail
 * above the pass. Here they arrive as you scroll — one dish per ticket, in
 * service order — and the last one to land is the visitor's own, holding the
 * call to action. The CTA is the payoff of the metaphor rather than a panel
 * bolted underneath it.
 *
 * Every ticket's arrival is a function of the scene's `--p`, so the rail
 * fills and empties smoothly in both directions.
 */
@Component({
  selector: 'app-ticket-rail',
  imports: [ScrollSceneDirective, MagneticDirective],
  templateUrl: './ticket-rail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketRailComponent {
  private readonly authService = inject(AuthService);

  /**
   * Tonight's service. Drawn from a pool of fifty and rotated daily, so the
   * rail a visitor sees today isn't the one they saw last week.
   */
  protected readonly tickets: readonly Ticket[] = ticketsForDay(new Date()).map((dish, index) => ({
    ...dish,
    time: SERVICE_TIMES[index],
    at: 0.04 + index * 0.13,
    tilt: HANG_ANGLES[index],
  }));

  /** The last ticket on the rail is the visitor's. */
  protected readonly ownTicketAt = 0.74;

  protected startSignup(): void {
    this.authService.promptLogin('signup');
  }
}
