import { Command } from 'commander';
import chalk from 'chalk';
import { setConfigValue, getGlobalConfig } from '../../core/config.js';

export const configCommand = new Command('config')
  .description('Manage BackForge configuration');

configCommand
  .command('set <key> <value>')
  .description('Set a configuration value (dot-notation supported)')
  .action((key: string, value: string) => {
    setConfigValue(key, value);
    console.log(chalk.green(`✅ Set ${key} = ${value}`));
  });

configCommand
  .command('list')
  .description('Show current configuration')
  .action(() => {
    const config = getGlobalConfig();
    console.log(chalk.bold('\n⚙️  BackForge Configuration\n'));

    if (Object.keys(config).length === 0) {
      console.log(chalk.dim('  No configuration set.'));
      console.log(chalk.dim('  Run: backforge config set <key> <value>'));
      return;
    }

    printConfig(config, '');
  });

function printConfig(obj: Record<string, unknown>, prefix: string): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      printConfig(value as Record<string, unknown>, fullKey);
    } else {
      // Mask sensitive values
      const displayValue = isSensitive(key)
        ? chalk.dim('****' + String(value).slice(-4))
        : chalk.cyan(String(value));
      console.log(`  ${chalk.bold(fullKey)}: ${displayValue}`);
    }
  }
}

function isSensitive(key: string): boolean {
  const sensitiveKeys = ['key', 'secret', 'token', 'password', 'apikey', 'anonkey', 'servicerolekey'];
  return sensitiveKeys.some((sk) => key.toLowerCase().includes(sk));
}
