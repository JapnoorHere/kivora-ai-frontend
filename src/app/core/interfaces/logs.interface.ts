export interface AiInteractionLogEntry {
  readonly id: string;
  readonly action: 'generate' | 'modify';
  readonly provider: 'gemini' | 'groq';
  readonly model: string;
  readonly usingPersonalKey: boolean;
  readonly input: Record<string, unknown> | null;
  readonly success: boolean;
  readonly durationMs: number;
  readonly errorReason: string | null;
  readonly createdAt: string;
}
