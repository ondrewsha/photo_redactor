interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL: string;
  readonly VITE_FEATURE_ADMIN_UI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
