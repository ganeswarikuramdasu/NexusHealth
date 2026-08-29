/**
 * Utility for safe API requests with non-JSON / HTML fallback protection
 */

export async function safeFetchJson<T = any>(
  url: string,
  optionsOrFallback?: RequestInit | T,
  fallbackVal?: T
): Promise<T> {
  let options: RequestInit | undefined;
  let fallback: T = fallbackVal as T;

  if (
    optionsOrFallback &&
    typeof optionsOrFallback === "object" &&
    ("method" in optionsOrFallback ||
      "headers" in optionsOrFallback ||
      "body" in optionsOrFallback ||
      "credentials" in optionsOrFallback ||
      "mode" in optionsOrFallback)
  ) {
    options = optionsOrFallback as RequestInit;
    fallback = (fallbackVal !== undefined ? fallbackVal : null) as T;
  } else if (fallbackVal === undefined && optionsOrFallback !== undefined) {
    options = undefined;
    fallback = optionsOrFallback as T;
  } else {
    options = optionsOrFallback as RequestInit;
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // Check if error response is JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const errData = await res.json();
          return errData as T;
        } catch {
          return fallback;
        }
      }
      return fallback;
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return fallback;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`SafeFetch error for ${url}:`, err);
    return fallback;
  }
}

export async function parseResponseSafe<T = any>(
  res: Response,
  fallback: T = null as unknown as T
): Promise<T> {
  try {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return fallback;
    }
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
