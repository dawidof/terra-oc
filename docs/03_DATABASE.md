# Database plan

Recommended DB: PostgreSQL.

## 1. Main domains

### Catalog
- brands
- car_models
- model_versions
- trims
- specification_groups
- specification_definitions
- trim_specification_values
- vehicle_media
- vehicle_offers
- used_vehicle_details
- configuration_option_groups
- configuration_options

### Commercial calculation
- calculation_rules
- calculation_rule_versions
- exchange_rates
- logistics_rules
- service_fee_rules
- calculation_snapshots

### CRM
- users
- customers
- leads
- lead_configurations
- lead_notes
- lead_activities
- lead_assignments optional
- lead_status_history

### Content
- reviews
- content_pages
- site_settings

### Import
- import_runs
- import_sources
- import_items
- raw_import_payloads optional

## 2. Users

```text
users
id
email
password_hash / auth_provider_id
name
role
active
created_at
updated_at
```

Roles:
- admin
- manager

### Permissions

Admin:
- all CRM;
- edit catalog;
- prices;
- calculator settings;
- reviews;
- site settings;
- managers.

Manager:
- CRM;
- assigned/all leads according to policy;
- notes;
- lead statuses;
- customer contact data;
- read catalog.

Manager cannot edit:
- global calculator formulas;
- public vehicle data;
- user permissions;
- site configuration.

## 3. Customers

```text
customers
id
name
phone
phone_normalized
telegram
whatsapp
email nullable
preferred_contact_method
created_at
updated_at
```

Duplicate detection:
- normalized phone is primary;
- email secondary.

## 4. Leads

```text
leads
id
customer_id
assigned_manager_id nullable
status
source
vehicle_offer_id nullable
trim_id nullable
estimated_total_usd nullable
currency
comment
utm_source
utm_medium
utm_campaign
referrer
created_at
updated_at
last_contact_at
next_follow_up_at nullable
```

Suggested statuses:
- new
- assigned
- contacted
- needs_follow_up
- qualified
- quote_sent
- negotiation
- won
- lost

Optional later:
- contract
- payment
- purchased
- shipping
- customs
- delivered

Do not turn MVP CRM into logistics ERP yet.

## 5. Lead configuration snapshot

Never depend only on live catalog relations.

```text
lead_configurations
id
lead_id
brand_name
model_name
model_version_name
trim_name
source_country
condition
configuration_json
source_price
source_currency
logistics_cost
customs_cost
service_fee
other_costs
estimated_total
exchange_rate
calculator_rule_version
created_at
```

`configuration_json` example:

```json
{
  "exterior_color": "Black",
  "interior_color": "Orange",
  "wheels": "21 inch",
  "options": [
    "Air suspension",
    "Premium audio"
  ],
  "unpriced_options": [
    "Orange interior"
  ]
}
```

## 6. Lead notes

```text
lead_notes
id
lead_id
user_id
body
created_at
```

## 7. Lead activity

```text
lead_activities
id
lead_id
user_id nullable
type
metadata_json
created_at
```

Examples:
- lead_created
- assigned
- status_changed
- note_added
- phone_clicked
- telegram_clicked
- quote_recalculated

## 8. Reviews

```text
reviews
id
name
city
rating
vehicle_label
text
image_url
video_url
social_url
published
featured
sort_order
created_at
```

MVP reviews are admin managed.

## 9. Site settings

```text
site_settings
key
value_json
updated_at
```

Examples:
- phone numbers
- Telegram URL
- Instagram URL
- YouTube URL
- office address
- default delivery range
- disclaimer
- default currency display

## 10. Price history

Recommended even in MVP:

```text
offer_price_history
id
vehicle_offer_id
price
currency
recorded_at
source
```

Useful because imported-car pricing changes often.

## 11. Audit log

For inline admin edits:

```text
audit_logs
id
user_id
entity_type
entity_id
action
before_json
after_json
created_at
```

This prevents accidental price/content edits from becoming invisible.
