/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API base, e.g. `https://xxx.onrender.com/api`, or `/api` to use Vercel rewrites. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
