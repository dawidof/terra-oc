# TerraOC — TerraAuto Lead Generation Website

Lead-generation website for TerraAuto, a vehicle importer based in Tashkent, Uzbekistan.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui (base-nova style)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js v5 (Credentials provider)
- **Deployment:** Vercel + Neon/Supabase PostgreSQL

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your PostgreSQL connection string and auth secret.

### 3. Set up database

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3030](http://localhost:3030).

## Login Credentials

After seeding:

| Role    | Email                  | Password  |
| ------- | ---------------------- | --------- |
| Admin   | admin@terraauto.uz     | admin123  |
| Manager | manager@terraauto.uz   | manager123 |

## Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start development server (port 3030)    |
| `npm run build`        | Build for production                     |
| `npm run start`        | Start production server                  |
| `npm run lint`         | Run ESLint                               |
| `npm run db:push`      | Push schema changes to database          |
| `npm run db:studio`    | Open Drizzle Studio                      |
| `npm run db:generate`  | Generate migration files                 |
| `npm run seed`         | Seed database with sample data           |
| `npm run import:scrape`| Scrape vehicles from competitor URLs     |
| `npm run import:persist`| Import scraped data to database         |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/           # Admin API (vehicles, reviews, settings, audit, import)
│   │   ├── auth/            # NextAuth API route
│   │   ├── calculate/       # Price calculator API
│   │   ├── choose/          # Help-me-choose API
│   │   ├── compare/         # Vehicle comparison API
│   │   ├── leads/           # Lead creation + management
│   │   └── search-trims/    # Trim search API
│   ├── cars/                # Catalog + vehicle detail pages
│   ├── choose/              # Help-me-choose wizard
│   ├── compare/             # Cross-car comparison
│   ├── crm/                 # CRM dashboard + lead detail + import
│   ├── calculator/          # Price calculator
│   ├── about/               # About page
│   ├── contacts/            # Contacts page
│   ├── how-it-works/        # How to buy page
│   ├── privacy/             # Privacy policy
│   ├── reviews/             # Reviews page
│   ├── login/               # Login page
│   ├── layout.tsx           # Root layout with header/footer
│   ├── not-found.tsx        # Custom 404 page
│   ├── error.tsx            # Global error boundary
│   ├── sitemap.ts           # Dynamic sitemap
│   └── robots.ts            # Robots.txt
├── components/
│   ├── admin/               # Admin editing components
│   ├── choose/              # Wizard components
│   ├── crm/                 # CRM components
│   ├── reviews/             # Review components
│   ├── ui/                  # shadcn/ui components
│   ├── site-header.tsx      # Shared header + footer
│   ├── car-card.tsx         # Car listing card
│   ├── filter-bar.tsx       # Catalog filters
│   ├── configurator.tsx     # Vehicle configurator
│   ├── lead-form.tsx        # Lead capture form
│   └── trim-comparison-table.tsx
├── contexts/
│   └── admin-context.tsx    # Admin mode context
├── db/
│   ├── index.ts             # Database connection
│   └── schema.ts            # Drizzle schema
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── admin.ts             # Admin API layer
│   ├── calculator.ts        # Price calculation logic
│   ├── compare.ts           # Comparison logic
│   ├── content.ts           # Reviews/pages queries
│   ├── crm.ts               # CRM query layer
│   ├── leads.ts             # Lead creation logic
│   ├── normalizer.ts        # Import field normalization
│   ├── queries.ts           # Catalog queries
│   ├── scoring.ts           # Scoring engine for wizard
│   └── validator.ts         # Import validation
└── scripts/
    ├── seed.ts              # Database seeder
    ├── import-scrape.ts     # Vehicle scraper
    └── import-persist.ts    # DB importer

data/
├── urls.txt                 # Competitor URLs for scraping
└── raw/                     # Scraped JSON data
```

## Public Routes

| Route           | Page                    |
| --------------- | ----------------------- |
| `/`             | Homepage                |
| `/cars`         | Catalog with filters    |
| `/cars/[slug]`  | Vehicle detail page     |
| `/choose`       | Help-me-choose wizard   |
| `/compare`      | Cross-car comparison    |
| `/calculator`   | Price calculator        |
| `/reviews`      | Customer reviews        |
| `/how-it-works` | How to buy              |
| `/about`        | About company           |
| `/contacts`     | Contact information     |
| `/privacy`      | Privacy policy          |

## Admin Routes

| Route             | Page                    |
| ----------------- | ----------------------- |
| `/login`          | Login page              |
| `/crm`            | CRM dashboard           |
| `/crm/leads/[id]` | Lead detail            |
| `/crm/import`     | Data import page        |

## Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `DATABASE_URL` — Neon/Supabase connection string
   - `AUTH_SECRET` — Random secret (generate with `openssl rand -base64 32`)
   - `BASE_URL` — Your Vercel URL
4. Deploy

### Database (Neon)

1. Create free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy connection string to `DATABASE_URL`
4. Run `npm run db:push` to create tables
5. Run `npm run seed` to populate sample data
