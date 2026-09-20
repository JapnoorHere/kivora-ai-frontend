import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RevealDirective } from '../../components/ui/reveal.directive';
import { TiltDirective } from '../../components/ui/tilt.directive';
import { AiUsage } from '../../core/interfaces/settings.interface';
import { SettingsApiService } from '../../core/services/settings-api.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-settings',
  imports: [RevealDirective, TiltDirective],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly api = inject(SettingsApiService);
  private readonly toast = inject(ToastService);

  protected readonly usage = signal<AiUsage | null>(null);
  protected readonly isLoading = signal<boolean>(true);

  constructor() {
    this.loadUsage();
  }

  private async loadUsage(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.usage.set(await this.api.getUsage());
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Could not load your usage.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected usagePercent(usage: AiUsage): number {
    if (usage.limit === 0) return 100;
    return Math.min(100, (usage.used / usage.limit) * 100);
  }
}
