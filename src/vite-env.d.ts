/// <reference types="vite/client" />

// Extend ImportMeta to include Vite's glob function
interface ImportMeta {
  readonly glob: (
    pattern: string,
    options?: {
      eager?: boolean;
      as?: string;
    }
  ) => Record<string, any>;
} 