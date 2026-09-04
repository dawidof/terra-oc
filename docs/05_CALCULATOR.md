# Import / full-cost calculator

## 1. Product goal

Do not present only "растаможка".

Primary concept:
**Ориентировочная стоимость автомобиля под ключ в Узбекистане**

The calculator should explain where the total comes from.

## 2. Two entry modes

### Catalog mode

Triggered from car page.

Pre-fill:
- origin;
- condition;
- vehicle/trim;
- source price;
- engine/powertrain;
- displacement;
- power;
- model year;
- any other known customs fields.

### Manual mode

User inputs:
- origin country;
- new/used;
- year/age;
- purchase price;
- currency;
- fuel type;
- engine displacement;
- power;
- EV battery if relevant;
- delivery parameters if needed.

## 3. Output structure

Example UI:

```text
Стоимость автомобиля        $34,500
Логистика                     $2,400
Таможенные платежи            $7,100
Сборы / оформление              $600
Услуги компании               $1,200
------------------------------------
Ориентировочно под ключ      $45,800
```

Break down customs further when formula is known and useful.

## 4. Rules must be versioned

Never hardcode business/customs rates only in React code.

```text
CalculationRuleVersion
id
country
condition
powertrain
valid_from
valid_to
parameters_json
formula_version
active
```

A calculation snapshot stores which rule version was used.

## 5. Exchange rates

Keep:
- USD base for commercial presentation;
- optional UZS equivalent.

```text
ExchangeRate
base_currency
quote_currency
rate
source
updated_at
```

For demo:
- admin can update manually.

Later:
- connect official exchange-rate source.

## 6. Disclaimer

Every result must clearly say it is an estimate.

Russian example:

`Расчёт носит ориентировочный характер. Итоговая стоимость зависит от фактической цены автомобиля, курса валют, стоимости логистики и действующих на дату оформления таможенных платежей.`

## 7. Legal/current-rule caution

Uzbek import/customs rules change. Before launch, formulas must be verified against current Uzbekistan requirements and preferably checked by a customs broker/accountant.

The system should therefore make changing rates possible without redeployment.

## 8. Lead conversion

Below every result:

`Получить точный расчёт`

Lead stores:
- all calculator inputs;
- all calculation components;
- exchange rate;
- rule version;
- final estimate.
