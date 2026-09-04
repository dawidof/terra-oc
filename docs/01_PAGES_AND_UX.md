# Pages and UX

## 1. Navigation

Recommended desktop header:

- Автомобили
- Помочь выбрать
- Сравнение
- Калькулятор
- Как купить
- Отзывы
- О компании
- Контакты

Right side:
- Telegram
- phone
- primary CTA: **Подобрать автомобиль**

Mobile:
- compact menu;
- sticky CTA optional;
- phone / Telegram accessible in one tap.

## 2. Homepage

### Hero

Goal: explain the business in 5 seconds.

Suggested structure:

**Автомобили из Китая, Кореи, США и Дубая под заказ**

Subtitle:
`Подберём, проверим, доставим и оформим автомобиль в Узбекистане. Вы заранее видите комплектацию и ориентировочную стоимость под ключ.`

Buttons:
- Смотреть автомобили
- Рассчитать стоимость

Trust points:
- прямые поставки;
- официальный договор;
- индивидуальный подбор комплектации;
- доставка ориентировочно 20–30 дней, if confirmed by business owner.

Do not copy competitor wording literally.

### Popular cars

6–8 vehicle cards.

Tabs can be:
- Популярные
- Электро
- Гибриды
- До $30 000
- До $50 000

### Help me choose

Strong visual CTA:
**Не знаете, какую машину выбрать?**

Start 4–5 step wizard.

### How purchase works

Example:
1. Выбор автомобиля
2. Расчёт стоимости
3. Договор и оплата
4. Выкуп автомобиля
5. Доставка
6. Таможенное оформление и передача

Exact legal/payment wording must be confirmed.

### Price transparency

Example breakdown card:
- автомобиль;
- логистика;
- таможенные платежи;
- сертификация / сборы;
- услуги компании;
- итоговая ориентировочная стоимость.

### Reviews

3–6 selected reviews controlled by admin.

### Why TerraAuto

Use verified differentiators only:
- direct import;
- experience;
- formal contract/payment;
- configuration selection;
- sourcing from several countries.

### Lead CTA

`Не нашли нужную машину?`

Fields:
- name;
- phone;
- preferred messenger;
- budget;
- comment.

## 3. Catalog `/cars`

### Search

One prominent search field:
`Марка или модель`

Search over:
- brand;
- model;
- alternative name;
- model code.

### Filters

MVP:
- source country;
- new / used;
- brand;
- model;
- body type;
- fuel / powertrain;
- price from/to;
- year from/to;
- drivetrain;
- seats;
- range;
- power.

Optional compact advanced filters:
- battery;
- engine displacement;
- acceleration;
- mileage for used offers.

### Sort

- popular;
- price ascending;
- price descending;
- newest;
- power;
- range.

### Car card

Recommended fields:
- main photo;
- brand + model;
- model year;
- short trim/reference configuration;
- EV / hybrid / petrol / diesel;
- drivetrain;
- range or engine;
- power;
- price "от";
- estimated turnkey price if available.

Actions:
- Подробнее
- Сравнить
- heart/favorites excluded from MVP.

## 4. Vehicle detail `/cars/[slug]`

### Top section

- breadcrumbs;
- vehicle name;
- year/generation;
- source country;
- gallery;
- starting source/CIP price;
- estimated turnkey price;
- delivery estimate;
- buttons:
  - Рассчитать стоимость
  - Выбрать комплектацию
  - WhatsApp / Telegram

### Trim selector

Use cards, not a plain select.

Each trim card:
- name;
- price;
- drivetrain;
- battery/engine;
- power;
- range;
- 0–100;
- important unique features.

Selection updates:
- displayed specs;
- price;
- comparison;
- configurator.

### Trim differences

Dedicated section:
`Отличия комплектаций`

Important differences first.

Then:
`Сравнить все характеристики`

### Technical specification

Expandable groups:
- Основные характеристики
- Размеры
- Двигатель
- Батарея и зарядка
- Ходовая часть
- Безопасность
- Системы помощи водителю
- Комфорт
- Салон
- Мультимедиа
- Экстерьер
- Колёса

### Configuration

- trim;
- exterior color;
- interior color;
- wheel option;
- additional options/packages.

Unknown price option:
`Цена уточняется`

Known price option:
`+$800`

### Full cost block

Show estimated cost breakdown.

### Lead CTA

Selected configuration must be carried into the form automatically.

### Similar cars

Use rules:
- similar body;
- ±25% price;
- same powertrain;
- comparable class.

## 5. Compare `/compare`

Support 2–4 cars.

Comparison levels:

### Summary
- price;
- total estimated price;
- year;
- source country;
- body;
- seats;
- powertrain.

### Performance
- power;
- torque;
- 0–100;
- top speed.

### EV/PHEV
- battery;
- claimed range;
- charging;
- architecture.

### Dimensions
- length;
- width;
- height;
- wheelbase;
- trunk.

### Equipment

Important boolean/enum features.

Controls:
- `Показывать только различия`
- remove car
- change selected trim

URL should preserve comparison:
`/compare?cars=...`

## 6. Help me choose `/select`

Wizard MVP:

### Step 1 — Budget
- до $25k
- $25–35k
- $35–50k
- $50–70k
- $70k+

### Step 2 — Condition
- новый
- с пробегом
- не важно

### Step 3 — Powertrain
- электро
- гибрид / PHEV / REEV
- бензин
- дизель
- не знаю

### Step 4 — Needs
Multi-select:
- семейный
- 7 мест
- городской
- дальние поездки
- динамика
- комфорт
- внедорожность
- минимальная цена

### Step 5 — priorities
Rank 2–3:
- price;
- range;
- power;
- equipment;
- size;
- running cost.

Result:
- 3–8 cars;
- explanation why;
- compare button;
- request form.

Do not use AI in MVP. Use deterministic scoring over structured specs.

## 7. Calculator `/calculator`

Two modes:

### A. Calculate a catalog car
Car/trim preselected.

### B. Manual vehicle
Inputs vary by origin and powertrain.

Always show:
- source price;
- logistics;
- customs/taxes;
- mandatory fees;
- company service fee if applicable;
- total;
- disclaimer;
- CTA.

## 8. Reviews `/reviews`

Only admin-managed reviews in MVP.

Fields visible:
- client name or first name;
- city;
- car;
- rating;
- text;
- optional image;
- optional video/social link;
- date.

## 9. How to buy `/how-it-works`

Explain:
- selection;
- quote;
- contract;
- payment;
- purchase;
- transport;
- customs;
- handover.

Use real TerraAuto process after owner confirms it.

## 10. About / Contacts

Must include verified:
- business description;
- years of experience;
- sourcing countries;
- office/meeting location;
- phones;
- Telegram;
- Instagram;
- YouTube;
- working hours.

Map optional for MVP.
