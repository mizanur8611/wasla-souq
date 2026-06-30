# Wasla Souq — Web (Phase 0, Food vertical)

A real, runnable Next.js ordering site for Wasla Souq's Food-first launch, on a real
**PostgreSQL** database — built on the generic Partner / CatalogItem / Order /
FulfilmentTask data model from the **Phase 0 Food-First Architecture** document, so Mart,
Pharmacy and Courier can be added later without rewriting this foundation.

## What's in here

- **Customer site**: browse restaurants → menu → cart → checkout → order tracking
- **`/admin`**: a bare-bones internal tool to onboard a new restaurant + menu while there's
  no real Partner Service with auth yet
- **No-surge pricing enforced in code**, not just copy — see `src/lib/pricing.ts`. The
  server always recomputes the price from the current catalog, never trusts a client total.
- **Bilingual-ready data model** — every partner/menu item has an optional `nameAr` field,
  ready for the Arabic-first UI pass.

## Quick start

### 1. Get a PostgreSQL database running

Any Postgres 13+ works — pick whichever is easiest for you:

**Local install (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql
sudo service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'wasla_dev_pw';"
sudo -u postgres psql -c "CREATE DATABASE wasla_souq;"
```

**Or Docker (works the same everywhere):**
```bash
docker run --name wasla-postgres -e POSTGRES_PASSWORD=wasla_dev_pw \
  -e POSTGRES_DB=wasla_souq -p 5432:5432 -d postgres:16
```

**Or a managed instance** (Supabase, Neon, RDS, Railway, etc.) — just copy its connection
string into `.env` in the next step.

### 2. Configure and run

```bash
cp .env.example .env        # then edit DATABASE_URL if you're not using the defaults above
npm install
npm run db:seed              # creates tables + loads 4 demo restaurants in Dubai
npm run dev                  # http://localhost:3000
```

Add more restaurants any time from `http://localhost:3000/admin`, or wipe and reset with:
```sql
TRUNCATE fulfilment_tasks, order_items, orders, catalog_items, partners, customers, cities CASCADE;
```

## Why raw SQL (`pg`) instead of Prisma Client at runtime

`prisma/schema.prisma` is the **canonical, documented data model** — every table and
column name in this project matches it exactly (see the `@map(...)` directives in that
file). It's what you should point real tooling (migrations, Prisma Studio, ERD generators)
at.

`src/lib/db.ts`, however, talks to Postgres directly through the `pg` driver rather than
the generated Prisma Client. The reason is purely environmental: `prisma generate`
downloads a query-engine binary from `binaries.prisma.sh`, which isn't reachable from
every network (including the sandboxed environment this project was first built in). `pg`
is a pure-JS/TCP client with nothing extra to download, so it works anywhere Postgres
itself is reachable.

**If your environment has normal internet access**, switching to Prisma Client is
optional but recommended once you're past Phase 0 prototyping:
1. `npx prisma generate`
2. Replace the function bodies in `src/lib/db.ts` with the equivalent
   `prisma.partner.findMany(...)` / `prisma.order.create(...)` calls — the exported
   function names and what they return were kept identical on purpose, so every API route
   and page that imports from `@/lib/db` needs no changes at all.

## Known items before production (see the Phase 0 architecture & roadmap docs)

- No real authentication yet — checkout currently attaches every order to one seeded
  demo customer (`src/app/api/orders/route.ts`). Wire up a real Auth/User service before
  launch.
- Payment is a mock selector (Card / Cash on Delivery) — no PSP is actually called. Wire
  up a gateway that supports mada / Jaywan / NAPS / KNET depending on market before
  launch (see the GCC Strategy document, Section 8).
- Order status on the tracking page is illustrative, not live — a real Fulfilment
  Service + rider app would drive these transitions.
- `npm audit` currently reports a few moderate/high advisories in Next.js 14.2.x that are
  only fully resolved by upgrading to Next 15/16 (a breaking change deferred deliberately
  for this Phase 0 pass — revisit before production launch).
- The `pg.Pool` in `src/lib/db.ts` uses default settings — set sensible `max` connections
  and SSL options before pointing this at a managed production database.

## Project structure

```
src/
  app/
    page.tsx                 home — restaurant list
    restaurant/[id]/page.tsx menu + add to cart
    cart/page.tsx
    checkout/page.tsx
    order/[id]/page.tsx       confirmation + status
    admin/page.tsx            internal restaurant onboarding
    api/                      partners, orders, admin routes
  components/                 Header, RestaurantCard, MenuList, CartContext
  lib/
    db.ts                     PostgreSQL data layer (generic Partner/CatalogItem/Order model)
    pricing.ts                centralised, no-surge price calculation
    seed.ts                   demo data
prisma/
  schema.prisma               canonical data model, mapped to the exact tables db.ts uses
```
