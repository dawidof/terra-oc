# AGENTS.md

## Project Overview

TerraAuto — lead-gen site and CRM for a vehicle importer in Uzbekistan.
Next.js 16 + Drizzle ORM + PostgreSQL. UI is in Russian, targeting Uzbek market.

## Environment Setup

### Databases

- **Development**: Local PostgreSQL at `localhost:5432/terra_oc` (owner: `dawidof`)
- **Production**: Neon serverless PostgreSQL (connection string in deployment platform, NOT in repo)

**Never run seed scripts, destructive SQL, or migrations against the production database.**

### Environment Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.env` | Local dev defaults | Yes (safe) |
| `.env.local` | Local overrides | No (gitignored) |
| `.env.development` | Dev-specific vars | No (gitignored) |
| `.env.production` | Production template | No (gitignored) |
| `.env.example` | Template for new devs | Yes |

### Running Scripts

```bash
# Seed database (always local dev)
DATABASE_URL="postgresql://dawidof@localhost:5432/terra_oc" npx tsx scripts/seed.ts

# Run migrations
pnpm drizzle-kit push

# Dev server (uses .env.local → local postgres)
pnpm dev
```

### Key Rule

If you need to query or modify data, **always use the local postgres database**. The Neon database is production — do not touch it from development or scripts.

To verify local DB state:
```bash
psql -U dawidof terra_oc -c "SELECT COUNT(*) FROM customers;"
```

## Architecture

### CRM

- `/crm` — admin panel (wrapped in `AppChrome`)
- `/crm/page.tsx` — dashboard with analytics
- `/api/admin/*` — CRM API routes

### Client Portal

- `/portal` — public client portal (site header/footer, NOT `AppChrome`)
- `/api/portal/lookup` — lookup by phone, quoteId, or leadId
- Portal wraps content in `Suspense` boundary for `useSearchParams`

### Database

- Schema: `src/db/schema.ts`
- DB connection: `src/db/index.ts`
- Seed: `scripts/seed.ts`

## Code Conventions

- All UI text in Russian
- No comments unless asked
- Prefer existing components from `src/components/ui/`
- Status management: `src/components/crm/status-badge.tsx` is the single source of truth
- Run `npx tsc --noEmit` after changes to verify types
