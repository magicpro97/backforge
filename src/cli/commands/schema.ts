import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadSchema, saveSchema, createEmptySchema, addTable, generateMigration } from '../../core/schema.js';
import { getSchemaPath, getProvider, getMergedConfig } from '../../core/config.js';
import { getProvider as getProviderInstance } from './init.js';
import type { Column, Table } from '../../types/index.js';

const COLUMN_TYPES = ['uuid', 'string', 'text', 'integer', 'float', 'decimal', 'boolean', 'timestamp', 'date', 'json'];

export const schemaCommand = new Command('schema')
  .description('Manage database schema');

schemaCommand
  .command('define')
  .description('Interactive schema builder — define tables, columns, and relations')
  .action(async () => {
    try {
      console.log(chalk.bold('\n📋 BackForge Schema Builder\n'));

      const schemaPath = getSchemaPath();
      let schema = existsSync(schemaPath) ? loadSchema(schemaPath) : createEmptySchema();

      let addMore = true;
      while (addMore) {
        const tableAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Table name (snake_case):',
            validate: (input: string) => input.trim().length > 0 || 'Table name is required',
          },
        ]);

        const columns: Column[] = [];

        // Always add an id column
        const idAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addId',
            message: 'Add auto UUID primary key (id)?',
            default: true,
          },
        ]);

        if (idAnswer.addId) {
          columns.push({ name: 'id', type: 'uuid', primary: true });
        }

        let addColumns = true;
        while (addColumns) {
          const colAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Column name:',
              validate: (input: string) => input.trim().length > 0 || 'Column name is required',
            },
            {
              type: 'list',
              name: 'type',
              message: 'Column type:',
              choices: COLUMN_TYPES,
            },
            {
              type: 'confirm',
              name: 'unique',
              message: 'Unique?',
              default: false,
            },
            {
              type: 'confirm',
              name: 'nullable',
              message: 'Nullable?',
              default: false,
            },
            {
              type: 'input',
              name: 'default',
              message: 'Default value (leave empty for none):',
            },
            {
              type: 'input',
              name: 'references',
              message: 'Foreign key reference (e.g., users.id, leave empty for none):',
            },
          ]);

          const column: Column = {
            name: colAnswers.name,
            type: colAnswers.type,
          };

          if (colAnswers.unique) column.unique = true;
          if (colAnswers.nullable) column.nullable = true;
          if (colAnswers.default) column.default = colAnswers.default;
          if (colAnswers.references) column.references = colAnswers.references;

          columns.push(column);

          const continueAnswer = await inquirer.prompt([
            { type: 'confirm', name: 'addMore', message: 'Add another column?', default: true },
          ]);
          addColumns = continueAnswer.addMore;
        }

        // Add created_at by default
        const timestampAnswer = await inquirer.prompt([
          { type: 'confirm', name: 'addTimestamps', message: 'Add created_at timestamp?', default: true },
        ]);

        if (timestampAnswer.addTimestamps) {
          columns.push({ name: 'created_at', type: 'timestamp', default: 'now()' });
        }

        const table: Table = { name: tableAnswers.name, columns };
        schema = addTable(schema, table);

        console.log(chalk.green(`\n✅ Table "${tableAnswers.name}" added with ${columns.length} columns\n`));

        const moreAnswer = await inquirer.prompt([
          { type: 'confirm', name: 'addMore', message: 'Define another table?', default: false },
        ]);
        addMore = moreAnswer.addMore;
      }

      saveSchema(schema, schemaPath);
      console.log(chalk.green(`\n📁 Schema saved to ${schemaPath}`));
      console.log(chalk.dim('  Next: backforge schema apply'));
    } catch (error) {
      const chalk = (await import('chalk')).default;
      console.error(chalk.red(`\n  ✗ ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

schemaCommand
  .command('apply')
  .description('Apply schema to database — generate and show migrations')
  .action(async () => {
    try {
      const spinner = ora('Loading schema...').start();
      const schemaPath = getSchemaPath();

      if (!existsSync(schemaPath)) {
        spinner.fail(`Schema file not found: ${schemaPath}`);
        console.log(chalk.yellow('  Run: backforge schema define'));
        return;
      }

      const schema = loadSchema(schemaPath);
      spinner.succeed(`Loaded schema with ${schema.tables.length} tables`);

      const config = getMergedConfig();
      if (config.provider) {
        const provider = getProviderInstance(config.provider);
        await provider.applySchema(schema);
      } else {
        // Just show the migration SQL
        const migration = generateMigration(schema);
        console.log(chalk.dim('\n--- Migration SQL ---'));
        console.log(chalk.cyan(migration));
        console.log(chalk.dim('--- End Migration ---\n'));

        // Save migration file
        const migrationsDir = 'migrations';
        if (!existsSync(migrationsDir)) {
          mkdirSync(migrationsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const migrationFile = `${migrationsDir}/${timestamp}_schema.sql`;
        writeFileSync(migrationFile, migration);
        console.log(chalk.green(`📁 Migration saved to ${migrationFile}`));
      }
    } catch (error) {
      const chalk = (await import('chalk')).default;
      console.error(chalk.red(`\n  ✗ ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

schemaCommand
  .command('export')
  .description('Export current schema to YAML')
  .action(async () => {
    try {
      const schemaPath = getSchemaPath();
      if (!existsSync(schemaPath)) {
        console.log(chalk.red(`Schema file not found: ${schemaPath}`));
        console.log(chalk.yellow('  Run: backforge schema define'));
        return;
      }

      const schema = loadSchema(schemaPath);
      const { stringify } = await import('yaml');
      const yamlContent = stringify(schema, { lineWidth: 120 });
      console.log(chalk.bold('\n📋 Schema Export\n'));
      console.log(yamlContent);
    } catch (error) {
      const chalk = (await import('chalk')).default;
      console.error(chalk.red(`\n  ✗ ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });
