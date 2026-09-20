import { ApiErrorCode } from '../enums/recipe.enum';

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

/** True when the error carries this specific backend error code. */
export function isErrorCode(error: unknown, code: ApiErrorCode): boolean {
  return getErrorCode(error) === code;
}

export interface ApiErrorView {
  readonly title: string;
  readonly message: string;
}

// Titles per known backend error code. The message still prefers whatever the
// server sent (it often carries specifics, e.g. the free-tier limit number) and
// only falls back to the copy here when there is none.
const TITLE_BY_CODE: Readonly<Record<string, string>> = {
  [ApiErrorCode.INVALID_DISH]: "That's not a recognisable dish",
  [ApiErrorCode.DIET_MISMATCH]: "Doesn't fit that diet",
  [ApiErrorCode.DIET_MISMATCH_MODIFICATION]: 'Change conflicts with the diet',
  [ApiErrorCode.FREE_LIMIT_REACHED]: 'Daily free limit reached',
  [ApiErrorCode.AI_TIMEOUT]: 'That took too long',
  [ApiErrorCode.AI_QUOTA_EXCEEDED]: 'Recipe engine at capacity',
};

const FALLBACK_MESSAGE_BY_CODE: Readonly<Record<string, string>> = {
  [ApiErrorCode.INVALID_DISH]:
    'Try a specific recipe name, like "Butter Chicken" or "Margherita Pizza".',
  [ApiErrorCode.DIET_MISMATCH]:
    'This dish conflicts with the diet you picked. Adjust the diet or the dish and try again.',
  [ApiErrorCode.DIET_MISMATCH_MODIFICATION]:
    "That change clashes with this recipe's dietary preference. Try a different swap.",
};

/**
 * Turns an API error into a titled, human message so each validation category
 * gets its own visible feedback rather than one generic toast.
 */
export function describeApiError(error: unknown, fallbackMessage: string): ApiErrorView {
  const code = getErrorCode(error);
  if (code && code in TITLE_BY_CODE) {
    return {
      title: TITLE_BY_CODE[code],
      message: getErrorMessage(error, FALLBACK_MESSAGE_BY_CODE[code] ?? fallbackMessage),
    };
  }
  return { title: 'Something went wrong', message: getErrorMessage(error, fallbackMessage) };
}
