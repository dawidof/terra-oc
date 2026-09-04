# TerraAuto — MVP website plan

## 1. Product definition

TerraAuto website is **not a marketplace**. It is a sales and lead-generation website for a company that imports vehicles to Uzbekistan on customer order.

Primary business model:

1. Customer discovers a vehicle.
2. Customer compares models and trims.
3. Customer selects a trim and optional configuration.
4. Website shows an estimated landed / "turnkey" price.
5. Customer submits a request.
6. The selected configuration and price snapshot are saved.
7. A manager opens the lead in CRM, contacts the customer and continues the sale offline.

All vehicles in MVP are **under order**. There is no public "in stock" catalog.

## 2. Geographic and business scope

Target market:
- Uzbekistan
- primary city: Tashkent

Vehicle sourcing directions:
- China
- South Korea
- USA
- Dubai / UAE

Vehicle condition:
- new
- used

Primary website language in MVP:
- Russian

Architecture should not block Uzbek language later, but multilingual UI is out of MVP.

## 3. TerraAuto positioning to reflect

Public TerraAuto listings describe the company with the following recurring facts:

- direct vehicle import;
- vehicles can be оформлены на имя клиента или его компании;
- configuration and color are selected individually;
- typical advertised delivery period is 20–30 days;
- payment can be made officially under a contract / bank transfer;
- TerraAuto positions itself as having more than three years of experience importing vehicles from China;
- direct supply without intermediaries is an important sales claim;
- location mentioned publicly: Tashkent, Sergeli district, Aysel customs warehouse / Index auto market;
- Instagram: `terraauto_`;
- YouTube: `TerraAutoUz`.

Before production, all commercial claims, phone numbers, address, delivery terms and payment methods must be confirmed with the business owner.

## 4. Product goals

The MVP must:

- look like a real commercial automotive website, not a prototype;
- contain 30–50 well-filled vehicle models;
- give the customer enough technical information to make a shortlist;
- make trims understandable;
- calculate estimated total purchase/import cost;
- make comparison easy;
- collect qualified leads with selected vehicle configuration;
- provide admin + manager CRM;
- let admins edit public content directly without building a heavy admin panel;
- be deployable on a free hosting/database tier for customer demonstration.

## 5. Main conversion paths

### Path A — customer knows the model

Home → Catalog → Vehicle → Trim → Configuration → Price calculation → Lead

### Path B — customer compares cars

Home → Catalog → Add to comparison → Compare → Vehicle → Configuration → Lead

### Path C — customer does not know what to buy

Home → "Помочь выбрать" → questionnaire → recommended vehicles → Vehicle → Configuration → Lead

### Path D — customer wants to know import cost

Home / Vehicle → Calculator → estimated full cost → "Получить предложение" → Lead

## 6. MVP scope

Included:

- homepage;
- catalog;
- vehicle search and filters;
- brand/model pages;
- vehicle detail;
- trims;
- trim comparison;
- comparison between vehicles;
- configurator;
- estimated full-cost calculator;
- "Помочь выбрать";
- reviews;
- lead forms;
- CRM;
- users with admin/manager roles;
- inline editing for admin;
- one-time importer/parser for 30–50 cars;
- PostgreSQL;
- free demo deployment.

Not included:

- online payments;
- user registration for customers;
- customer cabinet;
- inventory / in-stock sales;
- financing application workflow;
- public user reviews;
- automated recurring synchronization with competitor sites;
- full enterprise CRM;
- accounting;
- contract generation;
- delivery tracking portal;
- multilingual UI in MVP.

## 7. Core product principle

The website should sell **certainty and transparency**, not only cars.

Every important car page should answer:

- What is this car?
- Which trim should I choose?
- How is it different from other trims?
- How much does it cost at source?
- What additional import costs are expected?
- How much is the estimated final price in Uzbekistan?
- How long will delivery take?
- What exactly do I need to do next?
