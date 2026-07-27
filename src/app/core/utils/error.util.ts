export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof Error && 'code' in error) {
    return (error as Error & { code?: string }).code;
  }
  return undefined;
}
