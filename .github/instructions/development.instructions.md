---
applyTo: "**/*.ts"
---

# BackForge Development Instructions

This is the **BackForge CLI** project — a backend bootstrapper that initializes, defines schemas, generates TypeScript types, seeds data, and deploys backends across Supabase, Firebase, PocketBase, and Appwrite.

## Architecture

### Providers (`src/providers/`)
- `base.ts` — Abstract base provider class with required methods
- `supabase.ts` — Supabase provider (PostgreSQL, REST API)
- `firebase.ts` — Firebase/Firestore provider
- `pocketbase.ts` — PocketBase provider
- `appwrite.ts` — Appwrite provider
- `index.ts` — Provider registry and factory

### Core (`src/core/`)
- `config.ts` — Config management at `~/.backforge/config.json`
- `schema.ts` — Schema definition, parsing, and YAML export
- `types-generator.ts` — TypeScript interface generation from schema
- `seeder.ts` — Fake data generation and insertion
- `deployer.ts` — Cloud deployment orchestration

### CLI Commands (`src/cli/commands/`)
- `init.ts` — Initialize backend project with provider selection
- `schema.ts` — Schema define/apply/export subcommands
- `types.ts` — TypeScript type generation from schema
- `seed.ts` — Generate and insert seed data
- `deploy.ts` — Deploy backend to cloud provider
- `status.ts` — Check backend health and connection
- `config.ts` — Configuration management

### Types (`src/types/`)
- `index.ts` — TypeScript interfaces for schema, config, providers

## Adding a New Provider

1. Create `src/providers/<name>.ts` extending the base provider class
2. Implement required methods: `init()`, `applySchema()`, `seed()`, `deploy()`, `status()`
3. Register in `src/providers/index.ts` provider registry
4. Add default config entry in `src/core/config.ts`

## Adding a New Command

1. Create `src/cli/commands/<name>.ts` exporting a `create<Name>Command()` function returning a Commander `Command`
2. Register in `src/index.ts` with `program.addCommand()`
3. Use the spinner + try/catch error handling pattern

## Conventions

- ESM modules (`"type": "module"` in package.json)
- All imports use `.js` extension (TypeScript ESM requirement)
- Dynamic imports for chalk/ora (ESM-only packages): `const chalk = (await import('chalk')).default`
- Node.js 20+ required
- No external HTTP dependencies — use built-in `fetch`
- Provider registry pattern: `Map<string, () => Provider>` for lazy instantiation
- Schema files use YAML format (`backforge-schema.yaml`)
- Local project config stored as `backforge.json` in project root

## Build & Run

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript (tsc)
npm run dev          # Build and run
node dist/index.js   # Run CLI directly
```

## Testing

```bash
npm run build
node dist/index.js --version
node dist/index.js --help
node dist/index.js init --help
node dist/index.js schema --help
node dist/index.js seed --help
node dist/index.js deploy --help
```

## CI/CD

- GitHub CI builds on push (`.github/workflows/ci.yml`)
- npm publish is automatic via GitHub Release (`.github/workflows/publish.yml`)
- NPM_TOKEN stored as GitHub repo secret — never commit tokens
