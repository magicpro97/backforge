import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { BackforgeConfig, ProviderName } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.backforge');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const LOCAL_CONFIG_FILE = 'backforge.json';

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getGlobalConfig(): BackforgeConfig {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function setGlobalConfig(config: BackforgeConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function setConfigValue(key: string, value: string): void {
  const config = getGlobalConfig();
  const keys = key.split('.');
  let current: Record<string, unknown> = config;

  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof current[keys[i]] !== 'object' || current[keys[i]] === null) {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  setGlobalConfig(config);
}

export function getConfigValue(key: string): unknown {
  const config = getGlobalConfig();
  const keys = key.split('.');
  let current: unknown = config;

  for (const k of keys) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[k];
  }

  return current;
}

export function getLocalConfig(): BackforgeConfig {
  if (!existsSync(LOCAL_CONFIG_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(LOCAL_CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function setLocalConfig(config: BackforgeConfig): void {
  writeFileSync(LOCAL_CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getMergedConfig(): BackforgeConfig {
  return { ...getGlobalConfig(), ...getLocalConfig() };
}

export function getProvider(): ProviderName | undefined {
  const config = getMergedConfig();
  return config.provider;
}

export function getSchemaPath(): string {
  const config = getMergedConfig();
  return config.schemaPath || 'backforge-schema.yaml';
}

export function getOutputDir(): string {
  const config = getMergedConfig();
  return config.outputDir || 'src/types';
}
