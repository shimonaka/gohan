export async function fetchJSONWithFallback<T>(
  input: RequestInfo,
  init: RequestInit | undefined,
  fallback: () => T,
  onError?: (error: unknown) => void
): Promise<T> {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    onError?.(error);
    return fallback();
  }
}
