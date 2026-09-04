# Simple CRM

## 1. Users

Roles:
- admin
- manager

CRM is private.

## 2. Main CRM page

Recommended route:
`/crm`

Desktop:
- kanban or table toggle.

MVP default: table because it handles more information.

Columns:
- client;
- phone;
- car;
- trim/configuration;
- estimated total;
- status;
- manager;
- created;
- next follow-up.

Filters:
- status;
- manager;
- date;
- source;
- vehicle;
- budget.

Search:
- client name;
- phone;
- vehicle.

## 3. Lead page

Header:
- customer;
- phone;
- Telegram;
- WhatsApp;
- status;
- assigned manager.

### Requested vehicle

Show snapshot:
- model;
- trim;
- new/used;
- source;
- selected colors;
- selected options;
- estimated cost breakdown.

### Customer request

- comment;
- budget;
- selector answers;
- page/source;
- UTM.

### Notes

Chronological manager notes.

### Timeline

- lead created;
- assigned;
- status changed;
- note;
- follow-up.

## 4. Assignment

Admin:
- assign any manager.

Manager:
- optionally "Взять заявку".

Recommended MVP policy:
- all managers can see all leads;
- only assigned manager owns follow-up;
- admin can reassign.

This is simpler than complex team permissions.

## 5. Follow-up

Field:
`next_follow_up_at`

CRM shows:
- overdue;
- today;
- upcoming.

No automated emails/reminders required in MVP.

## 6. Status workflow

Recommended:

```text
Новая
→ Связались
→ Квалифицирована
→ Предложение отправлено
→ Переговоры
→ Продажа
```

Alternative terminal:
`Отказ`

Reason for lost lead:
- expensive;
- no answer;
- bought elsewhere;
- postponed;
- wrong car;
- other.

## 7. Dashboard

Minimal:
- new leads today;
- new leads this week;
- leads by status;
- leads by manager;
- won;
- lost;
- top requested cars.

No complex BI.

## 8. Security

- CRM requires authentication;
- customer contact data never sent to public frontend payloads;
- role checks server-side;
- audit important changes;
- managers cannot modify price rules/site settings.
