/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}