# One-time data importer / parser

## 1. Goal

Populate approximately **30–50 vehicles** quickly with rich structured information.

Primary competitor reference:
- Gonzo Motors vehicle pages.

The importer is for initial content ingestion, not permanent synchronization.

## 2. Important content rule

Separate **facts** from **copyrightable editorial content**.

Good candidates to normalize:
- brand;
- model;
- trim names;
- prices;
- powertrain;
- battery;
- range;
- power;
- dimensions;
- equipment flags;
- specification tables.

Do not blindly republish:
- competitor marketing copy;
- company text;
- FAQ;
- reviews;
- legal pages;
- news;
- competitor contacts;
- competitor brand copy.

Descriptions should be rewritten for TerraAuto before production.

Photos must be used only where TerraAuto has the right to use them. For a demo, the technical importer can support image ingestion, but the production content workflow should replace unlicensed assets.

## 3. Import stages

```text
Discovery
→ Fetch
→ Extract
→ Raw save
→ Normalize
→ Validate
→ Preview
→ Publish
```

## 4. Discovery

Input:
- curated list of 30–50 competitor vehicle URLs, or
- catalog crawler with allowlist.

Prefer curated list for MVP.

Benefits:
- predictable;
- avoids importing irrelevant/old pages;
- easier QA.

## 5. Raw extraction

For every page capture:
- canonical URL;
- page title;
- brand/model;
- headline price;
- pricing basis such as CIP;
- trims;
- trim prices;
- trim difference descriptions;
- specification tables;
- gallery URLs;
- main description;
- related models;
- timestamp.

Save raw result for debugging.

## 6. Normalization

Map source labels to canonical fields.

Examples:

`Полный` → drivetrain=`awd`

`Электро` → powertrain=`bev`

`103 кВтч` → battery_capacity_kwh=103

`2,8 сек.` → acceleration_0_100=2.8

Do not guess when parsing fails.

Store:
- parsed value;
- raw source text.

## 7. Trim inheritance

A page may say:
- Trim B adds features to Trim A;
- Trim C adds features to Trim B.

Importer should:
1. parse hierarchy/order;
2. build complete feature set per trim;
3. preserve raw text;
4. flag ambiguous items for manual review.

## 8. Specification dictionary

Maintain aliases:

```text
"Запас хода"
"Запас хода (CLTC)"
"Дальность хода"
```

→ `range_km`

But preserve standard:
- CLTC
- WLTP
- NEDC
- EPA

Never compare ranges without displaying the test standard.

## 9. Validation screen

Before publish show:

- missing price;
- missing trim;
- duplicate trim;
- impossible values;
- battery without EV/PHEV;
- range without standard;
- source price but missing price basis;
- inconsistent model years.

## 10. Import command

Example:

```bash
pnpm import:cars --file ./data/gonzo_urls.txt
```

Optional:
```bash
pnpm import:cars --dry-run
```

## 11. Re-running

Importer uses source URL + external key.

Options:
- skip existing;
- update selected fields;
- create new version.

Default MVP:
**do not overwrite manually edited public records automatically**.

## 12. Provenance

Keep source metadata internally:

```text
source_site
source_url
imported_at
raw_label
```

This is useful for checking data quality.

Do not show competitor source branding on public TerraAuto pages unless intentionally required.
