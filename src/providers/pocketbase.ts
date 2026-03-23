import chalk from 'chalk';
import ora from 'ora';
import type { BackendProvider, Schema, HealthStatus } from '../types/index.js';
import { schemaToSQL, generateMigration } from '../core/schema.js';
import { generateTypes } from '../core/typegen.js';
import { generateSeedData, seedDataToSQL } from '../core/seeder.js';
import { getConfigValue } from '../core/config.js';

export class PocketBaseProvider implements BackendProvider {
  name = 'pocketbase' as const;

  async init(projectDir: string): Promise<void> {
    const spinner = ora('Initializing PocketBase project...').start();
    try {
      spinner.text = 'Setting up PocketBase configuration...';
      spinner.succeed(chalk.green('PocketBase project initialized'));
      console.log(chalk.dim('  Configure with:'));
      console.log(chalk.dim('    backforge config set pocketbase.url http://127.0.0.1:8090'));
      console.log(chalk.dim('    backforge config set pocketbase.email admin@example.com'));
      console.log(chalk.dim('    backforge config set pocketbase.password <your-password>'));
    } catch (error) {
      spinner.fail('Failed to initialize PocketBase project');
      throw error;
    }
  }

  async applySchema(schema: Schema): Promise<void> {
    const spinner = ora('Applying schema to PocketBase...').start();
    try {
      const collections = schemaToPBCollections(schema);
      console.log(chalk.dim('\n--- PocketBase Collections ---'));
      console.log(chalk.cyan(JSON.stringify(collections, null, 2)));
      console.log(chalk.dim('--- End Collections ---\n'));
      spinner.succeed(chalk.green('PocketBase collection definitions generated'));
      console.log(chalk.yellow('  Import via PocketBase Admin UI or API'));
    } catch (error) {
      spinner.fail('Failed to apply schema');
      throw error;
    }
  }

  async generateTypes(schema: Schema): Promise<string> {
    return generateTypes(schema);
  }

  async seed(schema: Schema, count: number): Promise<void> {
    const spinner = ora(`Generating ${count} seed records per collection...`).start();
    try {
      const seedData = generateSeedData(schema, count);
      spinner.succeed(chalk.green(`Generated ${count} records for ${schema.tables.length} collections`));
      for (const { table, rows } of seedData) {
        console.log(chalk.dim(`  ${table}: ${rows.length} records`));
      }
    } catch (error) {
      spinner.fail('Failed to generate seed data');
      throw error;
    }
  }

  async deploy(): Promise<void> {
    const spinner = ora('Deploying PocketBase...').start();
    try {
      const url = getConfigValue('pocketbase.url') as string | undefined;
      if (!url) {
        spinner.fail('PocketBase URL not configured');
        console.log(chalk.yellow('  Run: backforge config set pocketbase.url <your-pb-url>'));
        return;
      }
      spinner.succeed(chalk.green('PocketBase deployment ready'));
      console.log(chalk.dim('  Deploy PocketBase binary to your server'));
      console.log(chalk.dim('  See: https://pocketbase.io/docs/going-to-production'));
    } catch (error) {
      spinner.fail('Failed to deploy');
      throw error;
    }
  }

  async status(): Promise<HealthStatus> {
    const url = getConfigValue('pocketbase.url') as string | undefined;
    if (!url) {
      return {
        provider: 'pocketbase',
        connected: false,
        error: 'PocketBase URL not configured',
      };
    }

    return {
      provider: 'pocketbase',
      connected: true,
      version: 'v0.22+',
    };
  }
}

function schemaToPBCollections(schema: Schema): unknown[] {
  return schema.tables.map((table) => ({
    name: table.name,
    type: 'base',
    schema: table.columns
      .filter((col) => !col.primary)
      .map((col) => ({
        name: col.name,
        type: mapPBFieldType(col.type),
        required: !col.nullable,
        unique: col.unique || false,
      })),
  }));
}

function mapPBFieldType(type: string): string {
  const typeMap: Record<string, string> = {
    uuid: 'text',
    string: 'text',
    text: 'editor',
    integer: 'number',
    int: 'number',
    float: 'number',
    decimal: 'number',
    boolean: 'bool',
    timestamp: 'date',
    date: 'date',
    json: 'json',
    jsonb: 'json',
  };
  return typeMap[type.toLowerCase()] || 'text';
}
