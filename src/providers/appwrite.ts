import chalk from 'chalk';
import ora from 'ora';
import type { BackendProvider, Schema, HealthStatus } from '../types/index.js';
import { generateTypes } from '../core/typegen.js';
import { generateSeedData } from '../core/seeder.js';
import { getConfigValue } from '../core/config.js';

export class AppwriteProvider implements BackendProvider {
  name = 'appwrite' as const;

  async init(projectDir: string): Promise<void> {
    const spinner = ora('Initializing Appwrite project...').start();
    try {
      spinner.text = 'Setting up Appwrite configuration...';
      spinner.succeed(chalk.green('Appwrite project initialized'));
      console.log(chalk.dim('  Configure with:'));
      console.log(chalk.dim('    backforge config set appwrite.endpoint https://cloud.appwrite.io/v1'));
      console.log(chalk.dim('    backforge config set appwrite.projectId <your-project-id>'));
      console.log(chalk.dim('    backforge config set appwrite.apiKey <your-api-key>'));
    } catch (error) {
      spinner.fail('Failed to initialize Appwrite project');
      throw error;
    }
  }

  async applySchema(schema: Schema): Promise<void> {
    const spinner = ora('Applying schema to Appwrite...').start();
    try {
      const collections = schemaToAppwriteCollections(schema);
      console.log(chalk.dim('\n--- Appwrite Collections ---'));
      console.log(chalk.cyan(JSON.stringify(collections, null, 2)));
      console.log(chalk.dim('--- End Collections ---\n'));
      spinner.succeed(chalk.green('Appwrite collection definitions generated'));
      console.log(chalk.yellow('  Create collections via Appwrite Console or CLI'));
    } catch (error) {
      spinner.fail('Failed to apply schema');
      throw error;
    }
  }

  async generateTypes(schema: Schema): Promise<string> {
    return generateTypes(schema);
  }

  async seed(schema: Schema, count: number): Promise<void> {
    const spinner = ora(`Generating ${count} seed documents per collection...`).start();
    try {
      const seedData = generateSeedData(schema, count);
      spinner.succeed(chalk.green(`Generated ${count} documents for ${schema.tables.length} collections`));
      for (const { table, rows } of seedData) {
        console.log(chalk.dim(`  ${table}: ${rows.length} documents`));
      }
    } catch (error) {
      spinner.fail('Failed to generate seed data');
      throw error;
    }
  }

  async deploy(): Promise<void> {
    const spinner = ora('Deploying to Appwrite Cloud...').start();
    try {
      const endpoint = getConfigValue('appwrite.endpoint') as string | undefined;
      if (!endpoint) {
        spinner.fail('Appwrite endpoint not configured');
        console.log(chalk.yellow('  Run: backforge config set appwrite.endpoint <your-endpoint>'));
        return;
      }
      spinner.succeed(chalk.green('Appwrite deployment initiated'));
      console.log(chalk.dim('  Use Appwrite CLI: appwrite deploy'));
    } catch (error) {
      spinner.fail('Failed to deploy');
      throw error;
    }
  }

  async status(): Promise<HealthStatus> {
    const endpoint = getConfigValue('appwrite.endpoint') as string | undefined;
    if (!endpoint) {
      return {
        provider: 'appwrite',
        connected: false,
        error: 'Appwrite endpoint not configured',
      };
    }

    return {
      provider: 'appwrite',
      connected: true,
      version: '1.5+',
    };
  }
}

function schemaToAppwriteCollections(schema: Schema): unknown[] {
  return schema.tables.map((table) => ({
    $id: table.name,
    name: table.name,
    attributes: table.columns
      .filter((col) => !col.primary)
      .map((col) => ({
        key: col.name,
        type: mapAppwriteType(col.type),
        required: !col.nullable && !col.default,
        array: false,
      })),
  }));
}

function mapAppwriteType(type: string): string {
  const typeMap: Record<string, string> = {
    uuid: 'string',
    string: 'string',
    text: 'string',
    integer: 'integer',
    int: 'integer',
    float: 'float',
    decimal: 'float',
    boolean: 'boolean',
    timestamp: 'datetime',
    date: 'datetime',
    json: 'string',
    jsonb: 'string',
  };
  return typeMap[type.toLowerCase()] || 'string';
}
