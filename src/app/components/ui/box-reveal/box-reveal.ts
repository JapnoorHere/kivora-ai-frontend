import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  input,
  inject,
} from '@angular/core';

/**
 * Reveals its content from behind a solid curtain that wipes away to the right.
 * Fires once, the first time the block enters the viewport.
 *
 * Timing is handed to CSS as custom properties rather than driven from here, so
 * a stack of these staggers without any JS running per frame.
 */
@Component({
  selector: 'app-box-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box-reveal-content">
      <ng-content />
    </div>
    <div class="box-reveal-curtain" aria-hidden="true"></div>
  `,
  host: {
    class: 'box-reveal',
    '[class.is-revealed]': 'revealed',
    '[style.width]': 'width()',
    '[style.overflow]': 'overflow()',
    '[style.--curtain-color]': 'color()',
    '[style.--curtain-duration.ms]': 'duration()',
    '[style.--curtain-delay.ms]': 'delay()',
  },
})
export class BoxRevealComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  public readonly width = input<string>('fit-content');
  public readonly color = input<string>('#fbbf24');
  public readonly duration = input<number>(500);
  public readonly delay = input<number>(0);
  /**
   * Clipping the rising content is the point — but a child that paints outside
   * its box (a drop shadow, a magnetic nudge, the hover hairline) needs
   * 'visible'. The curtain collapses to zero width, so it never escapes either way.
   */
  public readonly overflow = input<'hidden' | 'visible'>('hidden');

  protected revealed = false;
  private observer: IntersectionObserver | null = null;

  public ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.reveal();
      return;
    }

    // Outside Angular: this fires once and only toggles a class, so there is
    // nothing for change detection to do beyond the host binding below.
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.reveal();
        }
      });
      this.observer.observe(this.host.nativeElement);
    });
  }

  public ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private reveal(): void {
    this.revealed = true;
    this.host.nativeElement.classList.add('is-revealed');
    this.observer?.disconnect();
  }
}
