export async function fetchJSONWithFallback<T>(
  input: RequestInfo,
  init: RequestInit | undefined,
  fallback: () => T,
  onError?: (error: unknown) => void,
  timeout: number = 5000
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    onError?.(error);
    return fallback();
  }
}
