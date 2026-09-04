# Implementation phases

## Phase 0 — project setup

- Next.js repository
- TypeScript
- Tailwind/shadcn
- PostgreSQL
- ORM migrations
- auth
- roles
- seed admin
- basic deployment pipeline

Acceptance:
- app deployed;
- DB connected;
- admin can log in.

## Phase 1 — automotive schema

Implement:
- brands;
- models;
- versions;
- trims;
- specifications;
- offers;
- media;
- configuration options.

Acceptance:
- manually seed one complex car with 4+ trims;
- comparison table renders correctly.

## Phase 2 — public catalog

Implement:
- homepage shell;
- catalog;
- filters;
- search;
- cards;
- vehicle detail;
- gallery;
- trim selector;
- specifications.

Acceptance:
- responsive;
- URL state for filters;
- clear price basis.

## Phase 3 — importer

Implement:
- URL list;
- fetch/extract;
- raw snapshots;
- normalization;
- specification aliases;
- trim inheritance;
- dry-run;
- validation report.

Import first:
- 3 cars and QA schema.

Then:
- 30–50 cars.

Acceptance:
- no major malformed specs;
- all trims manually reviewed.

## Phase 4 — comparison

Implement:
- trim comparison;
- cross-car compare;
- only-differences toggle;
- URL persistence.

Acceptance:
- 2–4 models compare without layout failure on desktop/mobile.

## Phase 5 — calculator

Implement:
- versioned rules;
- source price;
- logistics;
- customs/fees;
- total;
- manual calculator;
- catalog-linked calculator;
- snapshot.

Acceptance:
- every calculation is reproducible from saved inputs/rule version.

## Phase 6 — configurator + leads

Implement:
- colors/options;
- unknown-price behavior;
- lead form;
- configuration snapshot;
- attribution.

Acceptance:
- CRM receives exact selected trim/configuration and calculation.

## Phase 7 — CRM

Implement:
- lead list;
- filters;
- assignment;
- status;
- notes;
- follow-up date;
- customer info;
- simple metrics.

Acceptance:
- admin + several managers can use it with correct permissions.

## Phase 8 — Help me choose

Implement:
- wizard;
- deterministic scoring;
- results;
- lead without vehicle;
- compare from results.

Acceptance:
- recommendations are explainable from database values.

## Phase 9 — reviews + content

Implement:
- review model;
- homepage reviews;
- reviews page;
- How it works;
- About;
- Contacts;
- verified TerraAuto information.

## Phase 10 — inline editing

Implement:
- admin mode;
- vehicle editing;
- trim/spec editor;
- price editing;
- review editing;
- site settings;
- audit log.

## Phase 11 — polish

- responsive QA;
- Russian copy;
- empty/loading/error states;
- SEO;
- analytics;
- performance;
- forms;
- legal/privacy text;
- calculator disclaimer;
- final data QA.

## Recommended build order principle

Do **not** import all 50 cars before the schema and one complex multi-trim vehicle are proven.

Best sequence:

1. model one complex vehicle;
2. build detail + comparison;
3. adjust schema;
4. only then import 30–50 cars.

This prevents the importer from locking the project into a weak data model.
