import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadSchema } from '../../core/schema.js';
import { generateSeedData, seedDataToSQL } from '../../core/seeder.js';
import { getSchemaPath, getMergedConfig } from '../../core/config.js';
import { getProvider as getProviderInstance } from './init.js';

export const seedCommand = new Command('seed')
  .description('Generate fake development seed data')
  .option('-c, --count <number>', 'Number of records per table', '10')
  .option('-o, --output <file>', 'Output SQL file')
  .action(async (options: { count: string; output?: string }) => {
    const count = parseInt(options.count, 10);
    if (isNaN(count) || count < 1) {
      console.error(chalk.red('Error: count must be a positive number'));
      process.exit(1);
    }
    const spinner = ora(`Generating ${count} seed records per table...`).start();

    const schemaPath = getSchemaPath();
    if (!existsSync(schemaPath)) {
      spinner.fail(`Schema file not found: ${schemaPath}`);
      console.log(chalk.yellow('  Run: backforge schema define'));
      return;
    }

    try {
      const schema = loadSchema(schemaPath);
      const config = getMergedConfig();

      if (config.provider) {
        spinner.stop();
        const provider = getProviderInstance(config.provider);
        await provider.seed(schema, count);
      } else {
        const seedData = generateSeedData(schema, count);
        const sql = seedDataToSQL(seedData);

        spinner.succeed(chalk.green(`Generated ${count} records for ${schema.tables.length} tables`));

        if (options.output) {
          const dir = options.output.includes('/') ? options.output.split('/').slice(0, -1).join('/') : '.';
          if (dir !== '.' && !existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(options.output, sql);
          console.log(chalk.dim(`  📁 Saved to ${options.output}`));
        } else {
          // Save to default location
          if (!existsSync('seeds')) {
            mkdirSync('seeds', { recursive: true });
          }
          const seedFile = `seeds/seed_${Date.now()}.sql`;
          writeFileSync(seedFile, sql);
          console.log(chalk.dim(`  📁 Saved to ${seedFile}`));
        }

        // Show summary
        for (const { table, rows } of seedData) {
          console.log(chalk.dim(`  ${table}: ${rows.length} records`));
        }
      }
    } catch (error) {
      spinner.fail('Failed to generate seed data');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });
