export interface FetchJsonResult {
  readonly response: Response;
  readonly result: unknown;
}

export async function fetchJson(url: string, options: RequestInit = {}): Promise<FetchJsonResult> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Exchanges cookies for backend session management
  });

  // A gateway timeout or proxy error returns HTML, not JSON. Parsing it blindly throws
  // a SyntaxError that buries the real status behind "Unexpected token <".
  let result: unknown = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  return { response, result: result ?? {} };
}
