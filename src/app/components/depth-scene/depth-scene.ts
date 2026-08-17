import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrollSceneDirective } from '../ui/scroll-scene.directive';

interface DepthDish {
  readonly url: string;
  /** Placement on its plane. */
  readonly top: string;
  readonly left: string;
  readonly size: string;
  /** Sideways drift across the scene, in vw. Keeps it off a pure vertical rail. */
  readonly dx: number;
  readonly rot: number;
  /** Phones carry the near plane only — nine dishes is too many to read. */
  readonly onMobile: boolean;
}

/**
 * A depth field the scroll moves through.
 *
 * Three planes travelling at different rates: the near one covers roughly four
 * times the distance of the far one, which is what produces depth rather than
 * the impression of a single layer sliding.
 *
 * The type sits *between* them — far dishes pass behind the words, near dishes
 * pass in front. That sandwich is the whole trick, and it costs nothing but
 * z-index ordering.
 */
@Component({
  selector: 'app-depth-scene',
  imports: [ScrollSceneDirective],
  templateUrl: './depth-scene.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepthSceneComponent {
  /** Small, dim, barely moving — the back of the room. */
  protected readonly far: readonly DepthDish[] = [
    { url: this.photo('1467003909585-2f8a72700288'), top: '12%', left: '15%', size: '12vmin', dx: -3, rot: -8, onMobile: false },
    { url: this.photo('1473093295043-cdd812d0e601'), top: '20%', left: '72%', size: '10vmin', dx: 4, rot: 11, onMobile: false },
    { url: this.photo('1414235077428-338989a2e8c0'), top: '64%', left: '24%', size: '13vmin', dx: 3, rot: 6, onMobile: false },
    { url: this.photo('1466637574441-749b8f19452f'), top: '71%', left: '78%', size: '11vmin', dx: -4, rot: -9, onMobile: false },
  ];

  /** Large, sharp, fast — and cropped by the edges, so the frame feels like a window. */
  protected readonly near: readonly DepthDish[] = [
    { url: this.photo('1484723091739-30a097e8f929'), top: '4%', left: '-7%', size: '27vmin', dx: 5, rot: -7, onMobile: true },
    { url: this.photo('1495521821757-a1efb6729352'), top: '28%', left: '80%', size: '30vmin', dx: -6, rot: 9, onMobile: true },
    { url: this.photo('1498837167922-ddd27525d352'), top: '70%', left: '10%', size: '24vmin', dx: 6, rot: 8, onMobile: true },
    { url: this.photo('1455619452474-d2be8b1e70cd'), top: '78%', left: '66%', size: '26vmin', dx: -5, rot: -11, onMobile: false },
    { url: this.photo('1476718406336-bb5a9690ee2a'), top: '-6%', left: '46%', size: '20vmin', dx: 3, rot: 12, onMobile: false },
  ];

  private photo(id: string): string {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=520&q=72`;
  }
}
