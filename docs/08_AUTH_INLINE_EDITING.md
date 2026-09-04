# Authentication and inline editing

## 1. Authentication

No customer accounts.

Private users:
- admin
- manager

Routes:
- `/login`
- `/crm`

## 2. Admin mode

When an admin is logged in, public pages can show:

`Режим редактирования`

Recommended toggle in header:
- off by default;
- on exposes edit controls.

## 3. What admin can edit inline

Vehicle page:
- title;
- short description;
- description;
- source/start price;
- delivery estimate;
- gallery;
- trim names;
- trim prices;
- key specs;
- specification values;
- active/published state;
- featured flag.

Homepage:
- hero text;
- selected featured cars;
- reviews;
- contact/site settings.

Calculator:
- settings should use a dedicated settings drawer/page rather than inline cells.

## 4. Editing patterns

### Small scalar
Click value → input → Save/Cancel.

### Long description
Click `Редактировать` → side drawer / modal.

### Specification group
Use editable table in drawer.

### Gallery
Use media manager modal.

### Trim
Use one trim editor drawer.

Avoid hundreds of pencil icons.

## 5. Validation

Price:
- numeric;
- currency required.

Range:
- numeric;
- standard optional but recommended.

Year:
- valid automotive year.

Slug:
- auto-generated unless manually overridden.

## 6. Optimistic editing

Can use optimistic UI for simple text, but price changes should confirm server success before showing final state.

## 7. Audit

Record:
- user;
- time;
- entity;
- before;
- after.

## 8. Manager restrictions

Managers should not see edit controls on public pages.

They only use CRM.
