import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadSchema } from '../../core/schema.js';
import { generateTypes } from '../../core/typegen.js';
import { getSchemaPath, getOutputDir } from '../../core/config.js';

export const typesCommand = new Command('types')
  .description('Generate TypeScript types from schema');

typesCommand
  .command('generate')
  .description('Generate TypeScript interfaces from current schema')
  .option('-o, --output <dir>', 'Output directory')
  .action(async (options: { output?: string }) => {
    const spinner = ora('Generating TypeScript types...').start();

    const schemaPath = getSchemaPath();
    if (!existsSync(schemaPath)) {
      spinner.fail(`Schema file not found: ${schemaPath}`);
      console.log(chalk.yellow('  Run: backforge schema define'));
      return;
    }

    try {
      const schema = loadSchema(schemaPath);
      const types = generateTypes(schema);
      const outputDir = options.output || getOutputDir();

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = join(outputDir, 'database.ts');
      writeFileSync(outputFile, types);

      spinner.succeed(chalk.green('TypeScript types generated'));
      console.log(chalk.dim(`  📁 ${outputFile}`));
      console.log(chalk.dim(`  ${schema.tables.length} interfaces generated`));

      // Preview
      console.log(chalk.dim('\n--- Preview ---'));
      const previewLines = types.split('\n').slice(0, 25);
      console.log(chalk.cyan(previewLines.join('\n')));
      if (types.split('\n').length > 25) {
        console.log(chalk.dim('... (truncated)'));
      }
      console.log(chalk.dim('--- End Preview ---'));
    } catch (error) {
      spinner.fail('Failed to generate types');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });
