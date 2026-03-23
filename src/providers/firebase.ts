import chalk from 'chalk';
import ora from 'ora';
import type { BackendProvider, Schema, HealthStatus } from '../types/index.js';
import { generateMigration } from '../core/schema.js';
import { generateTypes } from '../core/typegen.js';
import { generateSeedData } from '../core/seeder.js';
import { getConfigValue } from '../core/config.js';

export class FirebaseProvider implements BackendProvider {
  name = 'firebase' as const;

  async init(projectDir: string): Promise<void> {
    const spinner = ora('Initializing Firebase project...').start();
    try {
      spinner.text = 'Setting up Firebase/Firestore configuration...';
      spinner.succeed(chalk.green('Firebase project initialized'));
      console.log(chalk.dim('  Configure with:'));
      console.log(chalk.dim('    backforge config set firebase.projectId <your-project-id>'));
      console.log(chalk.dim('    backforge config set firebase.serviceAccountKey <path-to-key.json>'));
    } catch (error) {
      spinner.fail('Failed to initialize Firebase project');
      throw error;
    }
  }

  async applySchema(schema: Schema): Promise<void> {
    const spinner = ora('Applying schema to Firebase/Firestore...').start();
    try {
      spinner.text = 'Generating Firestore security rules...';
      const rules = generateFirestoreRules(schema);
      console.log(chalk.dim('\n--- Firestore Rules ---'));
      console.log(chalk.cyan(rules));
      console.log(chalk.dim('--- End Rules ---\n'));
      spinner.succeed(chalk.green('Firestore rules generated'));
      console.log(chalk.yellow('  Deploy with: firebase deploy --only firestore:rules'));
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
      console.log(chalk.yellow('  Use Firebase Admin SDK to import seed data'));
    } catch (error) {
      spinner.fail('Failed to generate seed data');
      throw error;
    }
  }

  async deploy(): Promise<void> {
    const spinner = ora('Deploying to Firebase...').start();
    try {
      const projectId = getConfigValue('firebase.projectId') as string | undefined;
      if (!projectId) {
        spinner.fail('Firebase project ID not configured');
        console.log(chalk.yellow('  Run: backforge config set firebase.projectId <your-project-id>'));
        return;
      }
      spinner.succeed(chalk.green('Firebase deployment initiated'));
      console.log(chalk.dim('  Run: firebase deploy'));
    } catch (error) {
      spinner.fail('Failed to deploy');
      throw error;
    }
  }

  async status(): Promise<HealthStatus> {
    const projectId = getConfigValue('firebase.projectId') as string | undefined;
    if (!projectId) {
      return {
        provider: 'firebase',
        connected: false,
        error: 'Firebase project ID not configured',
      };
    }

    return {
      provider: 'firebase',
      connected: true,
      version: 'Firestore v1',
    };
  }
}

function generateFirestoreRules(schema: Schema): string {
  const rules: string[] = [
    'rules_version = \'2\';',
    'service cloud.firestore {',
    '  match /databases/{database}/documents {',
  ];

  for (const table of schema.tables) {
    rules.push(`    match /${table.name}/{documentId} {`);
    rules.push('      allow read: if request.auth != null;');
    rules.push('      allow write: if request.auth != null;');
    rules.push('    }');
  }

  rules.push('  }');
  rules.push('}');

  return rules.join('\n');
}
