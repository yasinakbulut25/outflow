# Outflow

Personal finance tracker for iOS and Android. Full-stack personal project — REST API, MySQL schema, and React Native mobile app all built from scratch.

## What's in this repo

The mobile client. It connects to a REST API I built separately ([outflow-api](https://github.com/yasinakbulut/outflow-api)) backed by a MySQL database.

**API & backend work covers:**

- MySQL schema design — users, expenses, expense items (line items), recurring templates, incomes, categories
- JWT authentication (register/login, token-based auth on all endpoints)
- REST endpoints for full CRUD on expenses, recurring payments, incomes, and analytics aggregations
- Business logic: installment spreading across months, recurring payment projection, category-level aggregation

**Mobile client covers:**

- Full auth flow with secure token storage (expo-secure-store)
- Expense list grouped by month/day with installment timelines
- Add/edit/delete with multi-item support, installment count, and live total calculation
- Recurring payment templates that project into future months without duplicating
- Savings, income, and analytics screens
- RTK Query for data fetching and cache invalidation

## Features

- **Expenses** — Single or multi-item, peşin or taksitli. Installments auto-appear in future months.
- **Recurring payments** — Templates that project forward and never duplicate.
- **Savings** — Separate tracking with quantity and optional TL value.
- **Income** — One-time and recurring (e.g. salary).
- **Analytics** — Monthly income/expense chart, category breakdown, net balance.

## Stack

|           |                                 |
| --------- | ------------------------------- |
| Framework | Expo SDK 56 · React Native 0.85 |
| Routing   | expo-router                     |
| Styling   | NativeWind v4                   |
| State     | Redux Toolkit · RTK Query       |
| Forms     | react-hook-form · zod           |
| Build     | EAS Build                       |
