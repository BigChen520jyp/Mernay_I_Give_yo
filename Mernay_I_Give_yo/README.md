# Mernay

A money management app that links multiple accounts and provides insightful dashboards. Track spending and income, connect Canadian bank and credit accounts via Plaid, categorize transactions, set budgets, and export data.

## Stack

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS**
- **PostgreSQL** with **Prisma**
- **NextAuth.js** (email/password)
- **Plaid** for bank linking (provider-agnostic; Flinks can be added later)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/mernay`)
   - `NEXTAUTH_URL` – e.g. `http://localhost:3000`
   - `NEXTAUTH_SECRET` – random string (e.g. `openssl rand -base64 32`)
   - For bank linking: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox` (get keys from [Plaid Dashboard](https://dashboard.plaid.com/))

3. **Database**

   ```bash
   npx prisma db push
   npm run db:seed
   ```

   This creates tables and seeds default categories (Groceries, Dining, Transport, etc.).

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, then link an account (Plaid sandbox) and sync transactions.

## Features

- **Auth** – Sign up / sign in with email and password
- **Link accounts** – Connect bank/credit accounts via Plaid (Canadian and US institutions)
- **Sync transactions** – On-demand sync of the last 90 days; transactions stored and auto-categorized
- **Categorization** – Rule-based (keywords) plus manual override per transaction; optional user rules
- **Dashboard** – Income vs expenses, spending by category, linked accounts and transaction counts
- **Budgets** – Set monthly or weekly limits per category; progress bars vs current month spending
- **Export** – Download transactions as CSV (date range)
- **Manual entry & CSV import** – Add single transactions or bulk-import from CSV (date, name, amount columns)

## Project structure

- `src/app` – Routes (auth, dashboard, API)
- `src/components` – Dashboard nav, link account button, transaction list, budgets, manual/import UI
- `src/lib` – Auth config, Prisma client, bank provider (Plaid), categorization, sync logic
- `prisma/schema.prisma` – Data models (User, LinkedAccount, Transaction, Category, CategoryRule, Budget)

## Notes

- Confirm **TD Canada**, **American Express Canada**, and **PC Financial** support in [Plaid’s coverage](https://plaid.com/docs/institutions/) or with Plaid support; use manual/CSV for unsupported institutions.
- In production, store Plaid access tokens encrypted and use a secure `NEXTAUTH_SECRET`.
