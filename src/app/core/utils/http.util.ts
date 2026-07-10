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

  const result = await response.json();
  return { response, result };
}
