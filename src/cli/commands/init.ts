import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type { ProviderName } from '../../types/index.js';
import { setLocalConfig } from '../../core/config.js';
import { SupabaseProvider } from '../../providers/supabase.js';
import { FirebaseProvider } from '../../providers/firebase.js';
import { PocketBaseProvider } from '../../providers/pocketbase.js';
import { AppwriteProvider } from '../../providers/appwrite.js';

const PROVIDERS: Record<ProviderName, { name: string; description: string }> = {
  supabase: { name: 'Supabase', description: 'Open-source Firebase alternative with PostgreSQL' },
  firebase: { name: 'Firebase', description: 'Google\'s app development platform with Firestore' },
  pocketbase: { name: 'PocketBase', description: 'Open-source backend in a single binary' },
  appwrite: { name: 'Appwrite', description: 'Open-source backend server for web & mobile' },
};

export function getProvider(name: ProviderName) {
  switch (name) {
    case 'supabase': return new SupabaseProvider();
    case 'firebase': return new FirebaseProvider();
    case 'pocketbase': return new PocketBaseProvider();
    case 'appwrite': return new AppwriteProvider();
  }
}

export const initCommand = new Command('init')
  .argument('[provider]', 'Backend provider (supabase, firebase, pocketbase, appwrite)')
  .description('Initialize a new backend project with guided wizard')
  .action(async (providerArg?: string) => {
    try {
      console.log(chalk.bold('\n🗄️  BackForge — Backend Bootstrapper\n'));

      let providerName: ProviderName;

      if (providerArg && providerArg in PROVIDERS) {
        providerName = providerArg as ProviderName;
      } else {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'provider',
            message: 'Choose your backend provider:',
            choices: Object.entries(PROVIDERS).map(([key, val]) => ({
              name: `${val.name} — ${val.description}`,
              value: key,
            })),
          },
        ]);
        providerName = answers.provider;
      }

      const provider = getProvider(providerName);
      console.log(chalk.blue(`\nInitializing ${PROVIDERS[providerName].name}...\n`));

      await provider.init(process.cwd());

      // Save local config
      setLocalConfig({
        provider: providerName,
        projectDir: process.cwd(),
        schemaPath: 'backforge-schema.yaml',
        outputDir: 'src/types',
      });

      console.log(chalk.green('\n✅ Project initialized successfully!'));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim('  1. backforge schema define    — Define your data models'));
      console.log(chalk.dim('  2. backforge schema apply     — Apply schema to database'));
      console.log(chalk.dim('  3. backforge types generate   — Generate TypeScript types'));
      console.log(chalk.dim('  4. backforge seed             — Seed with fake data'));
    } catch (error) {
      const chalk = (await import('chalk')).default;
      console.error(chalk.red(`\n  ✗ ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });
