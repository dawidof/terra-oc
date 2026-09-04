# Configurator, comparison and "Помочь выбрать"

## 1. Configurator goal

The configurator is primarily a **lead qualification tool**, not a factory ordering system.

It must let a customer communicate exactly what they want.

## 2. Configuration flow

1. Select trim
2. Exterior color
3. Interior color
4. Wheels
5. Optional packages/options
6. Show calculated cost
7. Submit request

## 3. Unknown option prices

Do not invent prices.

UI:

`Оранжевый салон — цена уточняется`

The option is still selectable.

Total:
`от $48 700 + опции с уточняемой стоимостью`

Lead stores all selected options.

Manager sees:
`Needs price confirmation: Orange interior`

## 4. Trim comparison

Vehicle page has:
`Сравнить комплектации`

Columns = trims.
Rows = specification definitions.

Top rows should be commercial decision fields:
- price;
- total estimated price;
- drivetrain;
- battery/engine;
- range;
- power;
- acceleration;
- suspension;
- key comfort features;
- ADAS.

Then technical groups.

Feature:
`Показывать только отличия`

## 5. Cross-car comparison

Anonymous, URL-based.

Max: 4 vehicles.

Each compared vehicle must have a selected/default trim.

Comparison row model:
- key spec;
- normalized unit;
- display value.

For missing data:
`—`
Do not infer.

## 6. "Помочь выбрать"

Use structured scoring, not AI.

### Questionnaire inputs

Budget
Condition
Powertrain
Body type
Seats
Primary use
Priority attributes

### Example scoring

Budget fit:
- inside budget: +30
- within 10%: +15
- above 10%: -30

Desired powertrain:
- exact: +20
- "doesn't matter": 0

Seats:
- enough: +15
- not enough: exclude

Family:
- SUV/MPV: +10
- safety equipment richness: +10

Long-distance:
- high EV range or hybrid/ICE: +15

Performance:
- 0–100 / power percentile: +15

Price priority:
- lower estimated total among candidates: up to +15

### Output

For each recommendation:
- match score;
- 2–3 reasons;
- price;
- comparison CTA.

Example:
`Подходит вам: 91%`
- 7 мест
- укладывается в бюджет
- большой запас хода

## 7. Lead from selector

If user does not pick a specific car:
- save questionnaire answers;
- save recommended models shown;
- lead title: `Подбор автомобиля`;
- manager receives budget/preferences.

This prevents losing customers who are not ready to choose a model.
