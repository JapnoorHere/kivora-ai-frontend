export interface AiInteractionLogEntry {
  readonly id: string;
  readonly action: 'generate' | 'modify';
  readonly model: string;
  readonly input: Record<string, unknown> | null;
  readonly success: boolean;
  readonly durationMs: number;
  readonly errorReason: string | null;
  readonly createdAt: string;
}
