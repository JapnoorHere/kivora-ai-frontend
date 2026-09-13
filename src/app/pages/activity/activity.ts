import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RevealDirective } from '../../components/ui/reveal.directive';
import { AiInteractionLogEntry } from '../../core/interfaces/logs.interface';
import { LogsApiService } from '../../core/services/logs-api.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-activity',
  imports: [RevealDirective],
  templateUrl: './activity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityComponent {
  private readonly api = inject(LogsApiService);
  private readonly toast = inject(ToastService);

  protected readonly entries = signal<readonly AiInteractionLogEntry[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.entries.set(await this.api.fetchAiInteractions());
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Could not load your activity.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected dishName(entry: AiInteractionLogEntry): string {
    const input = entry.input ?? {};
    return (input['dishName'] as string) || (input['modificationText'] as string) || 'Recipe';
  }

  protected seconds(ms: number): string {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  protected relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }
}
