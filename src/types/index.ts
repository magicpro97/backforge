export type ProviderName = 'supabase' | 'firebase' | 'pocketbase' | 'appwrite';

export interface Column {
  name: string;
  type: string;
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string;
  references?: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Schema {
  tables: Table[];
}

export interface HealthStatus {
  provider: ProviderName;
  connected: boolean;
  latency?: number;
  version?: string;
  error?: string;
}

export interface BackendProvider {
  name: ProviderName;
  init(projectDir: string): Promise<void>;
  applySchema(schema: Schema): Promise<void>;
  generateTypes(schema: Schema): Promise<string>;
  seed(schema: Schema, count: number): Promise<void>;
  deploy(): Promise<void>;
  status(): Promise<HealthStatus>;
}

export interface BackforgeConfig {
  provider?: ProviderName;
  projectDir?: string;
  schemaPath?: string;
  outputDir?: string;
  [key: string]: unknown;
}
