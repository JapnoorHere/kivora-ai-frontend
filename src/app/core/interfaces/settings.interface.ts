import { AiProvider } from '../enums/recipe.enum';

export interface AiProviderStatus {
  readonly connected: boolean;
  readonly maskedKey: string | null;
}

export interface FreeUsage {
  readonly unlimited: boolean;
  readonly used: number;
  readonly limit: number;
  readonly remaining: number | null;
}

export interface AiSettings {
  readonly preferredProvider: AiProvider;
  readonly providers: Record<AiProvider, AiProviderStatus>;
  readonly freeUsage: FreeUsage;
}
