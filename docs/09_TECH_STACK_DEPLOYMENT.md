# Technical stack and demo deployment

## 1. Recommended architecture

Single application repository.

### Frontend + server
- Next.js
- TypeScript
- App Router

### UI
- Tailwind CSS
- shadcn/ui

### Database
- PostgreSQL

### ORM
Recommended: Drizzle ORM or Prisma.

For this MVP either is fine. Prefer the one the implementation agent/team already uses confidently.

### Authentication
- Auth.js or a similarly simple server-side session solution.

### Forms
- React Hook Form + schema validation such as Zod.

## 2. Why one app

Do not create separate Rails API + Next.js frontend for MVP unless there is a strong existing-team reason.

One Next.js application gives:
- faster iteration;
- one deployment;
- fewer auth/CORS issues;
- server actions/API endpoints for CRM/admin;
- enough capability for this project.

## 3. Search

MVP:
- PostgreSQL text search / trigram;
- indexed structured filters.

Do not add Elasticsearch/Meilisearch yet.

## 4. Images

Recommended production direction:
- object storage / image CDN.

For demo:
- use a free/low-cost compatible storage if available;
- external URLs are acceptable only temporarily and only when legally usable.

Store media metadata in DB.

## 5. Free deployment

Target:
- Vercel for Next.js demo;
- Neon or Supabase free PostgreSQL tier.

Free-tier limits change, so verify current limits before deployment.

Important:
- scraper should run locally/import through a script;
- do not rely on long-running serverless scraping jobs.

## 6. Environments

- local
- preview/demo
- production later

Environment variables:
- DATABASE_URL
- AUTH_SECRET
- BASE_URL
- storage credentials if used

## 7. Seed

Create:
- admin account;
- optional manager accounts;
- site settings;
- specification definitions;
- calculation rules;
- reviews;
- imported cars.

## 8. Performance

Use:
- server-rendered catalog/detail where useful;
- image optimization;
- pagination;
- indexed filters;
- caching for public catalog.

30–50 models is small, so keep architecture simple.

## 9. SEO

MVP should include:
- stable Russian slugs;
- title/description;
- canonical URLs;
- sitemap;
- robots;
- OpenGraph;
- structured data where appropriate.

Example:
`/cars/zeekr/7x`

Avoid copying competitor SEO text.

## 10. Analytics

Add basic analytics:
- catalog views;
- vehicle page views;
- calculator completion;
- configurator completion;
- lead submitted;
- WhatsApp click;
- Telegram click;
- compare usage;
- selector completion.

Can start with privacy-conscious/free analytics or Vercel analytics depending on current plan.
