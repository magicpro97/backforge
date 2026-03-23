import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getMergedConfig } from '../../core/config.js';
import { getProvider as getProviderInstance } from './init.js';
import type { ProviderName } from '../../types/index.js';

const DEPLOY_TARGETS: Record<ProviderName, string[]> = {
  supabase: ['Supabase Cloud'],
  firebase: ['Firebase Hosting', 'Google Cloud Run'],
  pocketbase: ['Railway', 'Fly.io', 'Self-hosted'],
  appwrite: ['Appwrite Cloud', 'Self-hosted'],
};

export const deployCommand = new Command('deploy')
  .description('Deploy backend to cloud provider')
  .action(async () => {
    console.log(chalk.bold('\n☁️  BackForge Deploy\n'));

    const config = getMergedConfig();

    if (!config.provider) {
      console.log(chalk.red('No provider configured.'));
      console.log(chalk.yellow('  Run: backforge init'));
      return;
    }

    const providerName = config.provider;
    const targets = DEPLOY_TARGETS[providerName];

    console.log(chalk.blue(`Provider: ${providerName}`));

    if (targets.length > 1) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'target',
          message: 'Choose deployment target:',
          choices: targets,
        },
      ]);
      console.log(chalk.dim(`\nDeploying to ${answer.target}...\n`));
    }

    const provider = getProviderInstance(providerName);
    await provider.deploy();

    console.log(chalk.green('\n✅ Deployment complete'));
  });
