/**
 * apiBase.ts
 * ----------
 * Central place to set the backend's public base URL for the whole app.
 *
 * The frontend calls relative paths like fetch("/api/auth/login"). That works
 * out of the box in local dev (Vite proxy) and on Vercel (vercel.json rewrite).
 *
 * On a STATIC host such as AWS S3 + CloudFront there is no server-side proxy,
 * so every "/api/..." call must be pointed at the real backend. Set the build
 * env var VITE_API_BASE_URL (e.g. http://YOUR_EC2_PUBLIC_DNS:8080) and this
 * module rewrites all relative /api requests to that base automatically —
 * no need to touch the ~70 call sites.
 *
 * Build with a base for AWS:
 *   VITE_API_BASE_URL=http://<ec2-dns>:8080 npm run build
 */
export function apiBase(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "");
  return base ?? "";
}

function realFetch(input: RequestInfo | URL, init?: RequestInit) {
  return window.fetch(input, init);
}

export function installApiBase() {
  if (typeof window === "undefined") return;
  const base = apiBase();
  if (!base) return; // no base configured -> keep relative (proxy handles it)

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    // Only rewrite same-origin relative "/api/..." URLs. Leave absolute URLs alone.
    if (typeof input === "string" && input.startsWith("/api/")) {
      return realFetch(base + input, init);
    }
    if (input instanceof URL && input.pathname.startsWith("/api/") && !input.href.startsWith("http")) {
      return realFetch(base + input.pathname + input.search, init);
    }
    return originalFetch(input, init);
  };
}

export function uninstallApiBase() {
  if (typeof window === "undefined") return;
  window.fetch = realFetch;
}
