#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './cli/commands/init.js';
import { schemaCommand } from './cli/commands/schema.js';
import { typesCommand } from './cli/commands/types.js';
import { seedCommand } from './cli/commands/seed.js';
import { deployCommand } from './cli/commands/deploy.js';
import { statusCommand } from './cli/commands/status.js';
import { configCommand } from './cli/commands/config.js';

const program = new Command();

program
  .name('backforge')
  .description('🗄️ BackForge — Backend Bootstrapper CLI\n\n  Multi-provider backend bootstrapping from your terminal.\n  Supports Supabase, Firebase, PocketBase, and Appwrite.')
  .version('1.0.0');

program.addCommand(initCommand);
program.addCommand(schemaCommand);
program.addCommand(typesCommand);
program.addCommand(seedCommand);
program.addCommand(deployCommand);
program.addCommand(statusCommand);
program.addCommand(configCommand);

// Show help by default if no arguments
if (process.argv.length <= 2) {
  program.outputHelp();
  console.log('');
  console.log('  Quick start:');
  console.log('    $ backforge init supabase');
  console.log('    $ backforge schema define');
  console.log('    $ backforge schema apply');
  console.log('    $ backforge types generate');
  console.log('    $ backforge seed --count 50');
  console.log('');
} else {
  program.parse();
}
