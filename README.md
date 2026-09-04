# TerraOC — TerraAuto Lead Generation Website

Lead-generation website for TerraAuto, a vehicle importer based in Tashkent, Uzbekistan.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
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

Open [http://localhost:3000](http://localhost:3000).

## Login Credentials

After seeding:

| Role    | Email                  | Password  |
| ------- | ---------------------- | --------- |
| Admin   | admin@terraauto.uz     | admin123  |
| Manager | manager@terraauto.uz   | manager123 |

## Scripts

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start development server         |
| `npm run build`      | Build for production             |
| `npm run start`      | Start production server          |
| `npm run lint`       | Run ESLint                       |
| `npm run db:push`    | Push schema changes to database  |
| `npm run db:studio`  | Open Drizzle Studio              |
| `npm run seed`       | Seed database with sample data   |

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/   # Auth API route
│   ├── crm/                      # CRM dashboard (protected)
│   ├── login/                    # Login page
│   └── page.tsx                  # Homepage
├── components/ui/                # shadcn/ui components
├── db/
│   ├── index.ts                  # Database connection
│   └── schema.ts                 # Drizzle schema
└── lib/
    ├── auth.ts                   # NextAuth configuration
    └── utils.ts                  # Utility functions
```

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
