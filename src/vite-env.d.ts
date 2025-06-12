/// <reference types="vite/client" />

// Environment variables defined in vite.config.ts
declare const __VITE_API_URL__: string;
declare const __VITE_API_AUTH_TOKEN__: string;
declare const __VITE_APP_ENV__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_AUTH_TOKEN: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
