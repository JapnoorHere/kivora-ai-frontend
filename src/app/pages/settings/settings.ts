import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { RevealDirective } from '../../components/ui/reveal.directive';
import { TiltDirective } from '../../components/ui/tilt.directive';
import { AiProvider } from '../../core/enums/recipe.enum';
import { AiSettings } from '../../core/interfaces/settings.interface';
import { SettingsApiService } from '../../core/services/settings-api.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessage } from '../../core/utils/error.util';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, ConfirmDialogComponent, RevealDirective, TiltDirective],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly api = inject(SettingsApiService);
  private readonly toast = inject(ToastService);

  protected readonly AiProvider = AiProvider;
  protected readonly settings = signal<AiSettings | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly savingProvider = signal<AiProvider | null>(null);
  protected readonly removingProvider = signal<AiProvider | null>(null);
  protected readonly switchingProvider = signal<AiProvider | null>(null);
  protected readonly removeTarget = signal<AiProvider | null>(null);

  protected readonly geminiKeyControl = new FormControl('', { nonNullable: true });
  protected readonly groqKeyControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.settings.set(await this.api.getAiSettings());
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Could not load your AI settings.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected providerLabel(provider: AiProvider): string {
    return provider === AiProvider.GEMINI ? 'Gemini' : 'Groq';
  }

  protected usagePercent(settings: AiSettings): number {
    if (settings.freeUsage.limit === 0) return 100;
    return Math.min(100, (settings.freeUsage.used / settings.freeUsage.limit) * 100);
  }

  protected async saveKey(provider: AiProvider): Promise<void> {
    const control = provider === AiProvider.GEMINI ? this.geminiKeyControl : this.groqKeyControl;
    const apiKey = control.value.trim();
    if (!apiKey || this.savingProvider()) return;

    this.savingProvider.set(provider);
    try {
      const updated = await this.api.saveApiKey(provider, apiKey);
      this.settings.set(updated);
      control.reset('');
      this.toast.success(`${this.providerLabel(provider)} connected. Unlimited recipes unlocked!`, 'Connected');
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'That API key could not be verified. Double-check it and try again.'));
    } finally {
      this.savingProvider.set(null);
    }
  }

  protected confirmRemove(provider: AiProvider): void {
    this.removeTarget.set(provider);
  }

  protected cancelRemove(): void {
    this.removeTarget.set(null);
  }

  protected async removeKey(): Promise<void> {
    const provider = this.removeTarget();
    if (!provider) return;

    this.removeTarget.set(null);
    this.removingProvider.set(provider);
    try {
      const updated = await this.api.removeApiKey(provider);
      this.settings.set(updated);
      this.toast.success(`${this.providerLabel(provider)} key removed.`);
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Could not remove this key.'));
    } finally {
      this.removingProvider.set(null);
    }
  }

  protected async setActive(provider: AiProvider): Promise<void> {
    if (this.switchingProvider()) return;

    this.switchingProvider.set(provider);
    try {
      const updated = await this.api.setPreferredProvider(provider);
      this.settings.set(updated);
      this.toast.success(`${this.providerLabel(provider)} is now your active provider.`);
    } catch (err: unknown) {
      this.toast.error(getErrorMessage(err, 'Could not switch providers.'));
    } finally {
      this.switchingProvider.set(null);
    }
  }
}
