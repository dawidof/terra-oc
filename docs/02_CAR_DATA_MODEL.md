# Automotive data model

The model must support:
- different generations/model years;
- multiple trims;
- trim-specific specifications;
- comparison tables;
- new and used sourcing;
- different source countries;
- configuration options;
- source and turnkey prices;
- imported competitor data without coupling the database to competitor HTML.

## 1. Brand

```text
Brand
id
name
slug
country
logo_url
description
sort_order
active
```

## 2. CarModel

Represents the commercial model name.

```text
CarModel
id
brand_id
name
slug
alternative_names[]
body_type
description
short_description
featured
active
```

Example:
- Brand: Zeekr
- CarModel: 7X

## 3. ModelVersion

Represents generation / facelift / model year family.

```text
ModelVersion
id
car_model_id
name
generation_code
model_year_from
model_year_to
production_status
default_source_country
length_mm
width_mm
height_mm
wheelbase_mm
seats
doors
description
seo_title
seo_description
```

Example:
`Zeekr 7X 2026`

## 4. Trim

A sellable factory trim/configuration.

```text
Trim
id
model_version_id
name
slug
powertrain_type
drivetrain
engine_displacement_cc
engine_power_kw
engine_power_hp
motor_power_kw
motor_power_hp
combined_power_kw
combined_power_hp
torque_nm
battery_capacity_kwh
range_km
range_standard
acceleration_0_100
top_speed_kmh
seats
base_price
base_price_currency
active
sort_order
```

Do not rely only on these columns. They are denormalized "key specs" for filtering and cards.

Full technical data goes through the specification system below.

## 5. SpecificationGroup

```text
SpecificationGroup
id
name
slug
sort_order
```

Examples:
- Основные характеристики
- Габариты
- Двигатель
- Батарея
- Зарядка
- Подвеска
- Безопасность
- ADAS
- Комфорт
- Мультимедиа
- Экстерьер

## 6. SpecificationDefinition

```text
SpecificationDefinition
id
group_id
name
slug
data_type
unit
comparison_priority
filterable
sort_order
```

`data_type`:
- string
- integer
- decimal
- boolean
- enum

Examples:
- battery_capacity
- claimed_range
- heated_front_seats
- air_suspension
- wheel_size

## 7. TrimSpecificationValue

```text
TrimSpecificationValue
id
trim_id
specification_definition_id
value_text
value_number
value_boolean
value_enum
source_note
```

This makes arbitrary trim comparison possible.

## 8. Feature inheritance / trim differences

Competitors often describe trims as:

- base trim has features X;
- next trim adds Y;
- highest trim adds Z.

Do not store only "additional features".

During import normalize each trim into a **complete effective feature set**.

Optional importer-only structure:
```text
TrimRawFeature
trim_id
text
relation: included | additional | removed
```

Then normalization produces proper specification values.

## 9. VehicleMedia

```text
VehicleMedia
id
model_version_id
trim_id nullable
type
url
storage_key
alt
sort_order
source_url
source_site
```

`type`:
- exterior
- interior
- detail
- video
- diagram

## 10. VehicleOffer

Needed because source-country and actual purchase conditions may vary.

```text
VehicleOffer
id
trim_id
source_country
condition
model_year
mileage_km nullable
source_price
source_currency
price_basis
estimated_logistics
estimated_customs
estimated_service_fee
estimated_total_usd
delivery_days_min
delivery_days_max
active
source_reference
last_price_update_at
```

`condition`:
- new
- used

`price_basis`:
- EXW
- FOB
- CIF
- CIP
- auction
- retail
- unknown

This avoids confusing a factory price, auction price and CIP Tashkent price.

## 11. Used-car offer extension

```text
UsedVehicleDetails
vehicle_offer_id
vin nullable
manufacture_date
first_registration_date
mileage_km
owners_count nullable
auction_grade nullable
accident_status
inspection_url nullable
auction_url nullable
```

Do not expose VIN if the business does not want it public.

## 12. ConfigurationOptionGroup

```text
ConfigurationOptionGroup
id
trim_id
type
name
required
sort_order
```

Types:
- exterior_color
- interior_color
- wheels
- package
- standalone_option

## 13. ConfigurationOption

```text
ConfigurationOption
id
group_id
name
code
image_url
price_delta
price_currency
price_known
available
sort_order
```

Important MVP rule:
- if exact price is known → update calculation;
- if unknown → store selected option but show `Цена уточняется`.

## 14. Comparison

No persistent comparison table is required for anonymous users.

Store selection client-side / URL.

Only selected lead configuration is persisted.

## 15. Why this structure

It supports:

- one model with many trims;
- tables comparing every trim;
- detailed equipment differences;
- filters using normalized key specs;
- new and used offers;
- China/Korea/USA/UAE offers;
- different pricing bases;
- colors/options without forcing fake prices;
- future expansion without rebuilding the catalog.
