# 🗄️ BackForge

**Backend Bootstrapper CLI** — Bootstrap your backend in seconds.

Initialize, define schemas, generate types, seed data, and deploy across multiple backend providers from a single CLI.

## Features

- 🚀 **Multi-provider support**: Supabase, Firebase, PocketBase, Appwrite
- 📋 **Schema-first**: Define data models in YAML → auto-generate migrations + TypeScript types
- 🎲 **Smart seeding**: Generate realistic fake development data
- 📝 **Type generation**: TypeScript interfaces from your database schema
- ☁️ **One-command deploy**: Deploy to Supabase Cloud, Firebase, Railway, Fly.io
- ⚡ **Interactive wizards**: Guided setup for every step

## Installation

```bash
npm install -g @magicpro97/backforge
```

## Quick Start

```bash
# Initialize a new backend with Supabase
backforge init supabase

# Define your schema interactively
backforge schema define

# Apply schema to your database
backforge schema apply

# Generate TypeScript types
backforge types generate

# Seed with fake data
backforge seed --count 50

# Deploy to cloud
backforge deploy
```

## Commands

| Command | Description |
|---------|-------------|
| `backforge init [provider]` | Interactive wizard: choose Supabase/Firebase/PocketBase/Appwrite |
| `backforge schema define` | Interactive schema builder (tables, columns, relations) |
| `backforge schema apply` | Apply schema to database (generate + run migrations) |
| `backforge schema export` | Export schema to YAML |
| `backforge types generate` | Generate TypeScript types from current schema |
| `backforge seed [--count N]` | Generate fake seed data |
| `backforge deploy` | Deploy backend to cloud provider |
| `backforge status` | Check backend status (health, connection) |
| `backforge config set <key> <value>` | Configure provider credentials |
| `backforge config list` | Show current configuration |

## Schema Format

Define your data models in YAML:

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: uuid
        primary: true
      - name: email
        type: string
        unique: true
      - name: name
        type: string
      - name: created_at
        type: timestamp
        default: now()

  - name: posts
    columns:
      - name: id
        type: uuid
        primary: true
      - name: title
        type: string
      - name: content
        type: text
      - name: author_id
        type: uuid
        references: users.id
      - name: created_at
        type: timestamp
        default: now()
```

## Providers

| Provider | Init | Schema | Types | Seed | Deploy |
|----------|------|--------|-------|------|--------|
| Supabase | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firebase | ✅ | ✅ | ✅ | ✅ | ✅ |
| PocketBase | ✅ | ✅ | ✅ | ✅ | ✅ |
| Appwrite | ✅ | ✅ | ✅ | ✅ | ✅ |

## Generated Types

BackForge generates clean TypeScript interfaces from your schema:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: Date;
}
```

## Configuration

```bash
# Set provider credentials
backforge config set supabase.url https://your-project.supabase.co
backforge config set supabase.anonKey your-anon-key

# View current config
backforge config list
```

## License

MIT © [magicpro97](https://github.com/magicpro97)
