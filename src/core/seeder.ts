import type { Schema, Table, Column } from '../types/index.js';
import { validateIdentifier } from './schema.js';

// Lightweight fake data generator (no external dependency)
const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Karen', 'Leo', 'Mia', 'Noah', 'Olivia', 'Peter',
  'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore',
];

const WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'hello',
  'world', 'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'backend',
  'service', 'deploy', 'schema', 'database', 'modern', 'cloud', 'platform',
  'robust', 'scalable', 'efficient', 'powerful', 'seamless', 'integration',
];

const DOMAINS = ['example.com', 'test.io', 'demo.dev', 'acme.org', 'corp.net'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateFakeValue(col: Column, rowIndex: number): unknown {
  if (col.primary && col.type === 'uuid') {
    return generateUUID();
  }

  if (col.references) {
    return null; // Will be filled in relation pass
  }

  const nameLower = col.name.toLowerCase();

  switch (col.type.toLowerCase()) {
    case 'uuid':
      return generateUUID();

    case 'string': {
      if (nameLower.includes('email')) {
        const first = randomElement(FIRST_NAMES).toLowerCase();
        const last = randomElement(LAST_NAMES).toLowerCase();
        return `${first}.${last}${rowIndex}@${randomElement(DOMAINS)}`;
      }
      if (nameLower.includes('name') || nameLower === 'username') {
        return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
      }
      if (nameLower.includes('title')) {
        const words = Array.from({ length: randomInt(3, 7) }, () => randomElement(WORDS));
        return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      if (nameLower.includes('url') || nameLower.includes('link')) {
        return `https://${randomElement(DOMAINS)}/${randomElement(WORDS)}`;
      }
      if (nameLower.includes('phone')) {
        return `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`;
      }
      return `${randomElement(WORDS)}_${randomInt(1, 1000)}`;
    }

    case 'text': {
      const sentenceCount = randomInt(2, 5);
      const sentences = Array.from({ length: sentenceCount }, () => {
        const wordCount = randomInt(5, 15);
        const words = Array.from({ length: wordCount }, () => randomElement(WORDS));
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        return words.join(' ') + '.';
      });
      return sentences.join(' ');
    }

    case 'integer':
    case 'int':
      if (nameLower.includes('age')) return randomInt(18, 80);
      if (nameLower.includes('count') || nameLower.includes('quantity')) return randomInt(0, 100);
      return randomInt(1, 10000);

    case 'float':
    case 'decimal':
      if (nameLower.includes('price') || nameLower.includes('amount')) {
        return Math.round(Math.random() * 999.99 * 100) / 100;
      }
      return Math.round(Math.random() * 100 * 100) / 100;

    case 'boolean':
      return Math.random() > 0.5;

    case 'timestamp':
    case 'date': {
      const now = Date.now();
      const past = now - randomInt(0, 365 * 24 * 60 * 60 * 1000);
      return new Date(past).toISOString();
    }

    case 'json':
    case 'jsonb':
      return { key: randomElement(WORDS), value: randomInt(1, 100) };

    default:
      return `${col.type}_${randomInt(1, 1000)}`;
  }
}

export interface SeedData {
  table: string;
  rows: Record<string, unknown>[];
}

// Sort tables so that referenced tables are processed before referencing tables
function topologicalSort(tables: Table[]): Table[] {
  const sorted: Table[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const tableMap = new Map(tables.map(t => [t.name, t]));

  function visit(table: Table): void {
    if (visited.has(table.name)) return;
    if (visiting.has(table.name)) return; // Circular dependency, skip
    visiting.add(table.name);

    for (const col of table.columns) {
      if (col.references) {
        const [refTableName] = col.references.split('.');
        const refTable = tableMap.get(refTableName);
        if (refTable && refTable.name !== table.name) {
          visit(refTable);
        }
      }
    }

    visiting.delete(table.name);
    visited.add(table.name);
    sorted.push(table);
  }

  for (const table of tables) {
    visit(table);
  }

  return sorted;
}

export function generateSeedData(schema: Schema, count: number): SeedData[] {
  const allSeedData: SeedData[] = [];
  const primaryKeys: Record<string, string[]> = {};

  const sortedTables = topologicalSort(schema.tables);

  // First pass: generate data for all tables
  for (const table of sortedTables) {
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const row: Record<string, unknown> = {};

      for (const col of table.columns) {
        if (col.default === 'now()') {
          row[col.name] = new Date().toISOString();
        } else {
          row[col.name] = generateFakeValue(col, i);
        }
      }

      rows.push(row);
    }

    // Store primary key values for foreign key resolution
    const pkCol = table.columns.find((c) => c.primary);
    if (pkCol) {
      primaryKeys[table.name] = rows.map((r) => r[pkCol.name] as string);
    }

    allSeedData.push({ table: table.name, rows });
  }

  // Second pass: resolve foreign key references
  for (const seedData of allSeedData) {
    const table = schema.tables.find((t) => t.name === seedData.table)!;

    for (const col of table.columns) {
      if (col.references) {
        const [refTable] = col.references.split('.');
        const refKeys = primaryKeys[refTable];

        if (refKeys && refKeys.length > 0) {
          for (const row of seedData.rows) {
            row[col.name] = randomElement(refKeys);
          }
        }
      }
    }
  }

  return allSeedData;
}

function escapeSQL(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '');
}

export function seedDataToSQL(seedData: SeedData[]): string {
  const statements: string[] = [];

  for (const { table, rows } of seedData) {
    validateIdentifier(table, 'table');
    for (const row of rows) {
      const columns = Object.keys(row);
      columns.forEach((col) => validateIdentifier(col, 'column'));
      const values = columns.map((col) => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${escapeSQL(val)}'`;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'object') return `'${escapeSQL(JSON.stringify(val))}'`;
        return String(val);
      });

      statements.push(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`
      );
    }
  }

  return statements.join('\n');
}
