/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional backend base URL for static deployments (e.g. AWS S3/CloudFront).
   *  When unset, the app uses relative "/api/..." paths (local dev / Vercel). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
