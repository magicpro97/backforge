import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getMergedConfig } from '../../core/config.js';
import { getProvider as getProviderInstance } from './init.js';

export const statusCommand = new Command('status')
  .description('Check backend status — health, connection, configuration')
  .action(async () => {
    console.log(chalk.bold('\n📊 BackForge Status\n'));

    const config = getMergedConfig();

    if (!config.provider) {
      console.log(chalk.yellow('No provider configured.'));
      console.log(chalk.dim('  Run: backforge init'));
      return;
    }

    const spinner = ora('Checking backend status...').start();

    try {
      const provider = getProviderInstance(config.provider);
      const health = await provider.status();

      spinner.stop();

      console.log(chalk.bold('Provider:   ') + chalk.blue(health.provider));
      console.log(chalk.bold('Connected:  ') + (health.connected ? chalk.green('✓ Yes') : chalk.red('✗ No')));

      if (health.version) {
        console.log(chalk.bold('Version:    ') + chalk.dim(health.version));
      }

      if (health.latency !== undefined) {
        console.log(chalk.bold('Latency:    ') + chalk.dim(`${health.latency}ms`));
      }

      if (health.error) {
        console.log(chalk.bold('Error:      ') + chalk.red(health.error));
      }

      // Show config summary
      console.log(chalk.bold('\nConfiguration:'));
      console.log(chalk.dim(`  Schema:     ${config.schemaPath || 'backforge-schema.yaml'}`));
      console.log(chalk.dim(`  Output:     ${config.outputDir || 'src/types'}`));
      console.log(chalk.dim(`  Project:    ${config.projectDir || process.cwd()}`));
    } catch (error) {
      spinner.fail('Failed to check status');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });
