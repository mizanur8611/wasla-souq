// Runtime data layer — real PostgreSQL via the `pg` driver.
//
// This intentionally does NOT use Prisma Client: Prisma's query-engine binary is
// downloaded from binaries.prisma.sh at `prisma generate` time, which isn't reachable
// from every environment. `pg` is a pure-JS/TCP client with no separate binary to fetch,
// so this file talks to Postgres directly with hand-written SQL that mirrors
// prisma/schema.prisma table-for-table, column-for-column.
//
// prisma/schema.prisma remains the canonical, documented data model. Anywhere with normal
// internet access, `npx prisma generate` + swapping these calls for the generated Prisma
// Client is a mechanical change — every function below returns the same shape the
// equivalent Prisma call would, and points at the same tables.

import { Pool } from "pg";
import { randomUUID } from "node:crypto";

// Render's managed Postgres requires SSL for external connections; a local or
// Docker Postgres during development normally has no cert set up at all. NODE_ENV alone
// can't distinguish these — `next build` / `next start` set it to "production" even when
// you're testing locally — so this is controlled by an explicit env var instead. Set
// DATABASE_SSL=true in Vercel's project settings when DATABASE_URL points at Render (or
// any other managed Postgres that requires SSL); leave it unset for local development.
const useSSL = process.env.DATABASE_SSL === "true";

// `max` is kept low deliberately: every Vercel serverless function invocation can spin up
// its own connection, and managed Postgres tiers (Render's free tier included) cap total
// connections — a high pool size here multiplies fast under concurrent traffic.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: useSSL ? 3 : 10,
});

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        currency TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS partners (
        id UUID PRIMARY KEY,
        partner_type TEXT NOT NULL DEFAULT 'restaurant',
        name TEXT NOT NULL,
        name_ar TEXT,
        cuisine_tag TEXT,
        city_id UUID NOT NULL REFERENCES cities(id),
        commission_rate REAL NOT NULL DEFAULT 0.15,
        halal_verified BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'approved',
        rating_avg REAL NOT NULL DEFAULT 4.5,
        eta_mins_low INTEGER NOT NULL DEFAULT 20,
        eta_mins_high INTEGER NOT NULL DEFAULT 35,
        hero_emoji TEXT NOT NULL DEFAULT '🍽️',
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS catalog_items (
        id UUID PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES partners(id),
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        name_ar TEXT,
        description TEXT,
        price REAL NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT true,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        city_id UUID NOT NULL REFERENCES cities(id),
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        vertical TEXT NOT NULL DEFAULT 'food',
        customer_id UUID NOT NULL REFERENCES customers(id),
        partner_id UUID NOT NULL REFERENCES partners(id),
        status TEXT NOT NULL DEFAULT 'placed',
        subtotal REAL NOT NULL,
        delivery_fee REAL NOT NULL,
        service_fee REAL NOT NULL,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'card',
        delivery_address TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id),
        catalog_item_id UUID REFERENCES catalog_items(id),
        name_snapshot TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fulfilment_tasks (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
        rider_name TEXT,
        status TEXT NOT NULL DEFAULT 'unassigned',
        eta_mins INTEGER NOT NULL DEFAULT 25,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Phase 1 addition: real authentication for restaurant owners and admins.
      -- role = 'admin' | 'restaurant_owner' (rider/customer roles join here in a later pass).
      -- partner_id is set only for restaurant_owner accounts, linking a login to the
      -- specific restaurant (Partner) they manage — see Phase 0 Food-First Architecture
      -- for why Partner stays the generic name even though only restaurants exist today.
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        partner_id UUID REFERENCES partners(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      -- Phase 1 addition: real food photos. CREATE TABLE IF NOT EXISTS above only applies to
      -- brand-new databases, so existing deployed tables need these columns added explicitly.
      ALTER TABLE partners ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS image_url TEXT;

      -- One-time backfill for the four Phase 0 demo restaurants seeded before image_url
      -- existed. Safe to run every boot: each UPDATE only touches rows still missing a photo.
      UPDATE partners SET image_url = 'https://loremflickr.com/600/400/mandi,rice,arabic'
        WHERE name = 'Saffron & Sumac' AND image_url IS NULL;
      UPDATE partners SET image_url = 'https://loremflickr.com/600/400/kebab,grill,middleeast'
        WHERE name = 'Manqal Grill House' AND image_url IS NULL;
      UPDATE partners SET image_url = 'https://loremflickr.com/600/400/karak,tea'
        WHERE name = 'Karak Corner' AND image_url IS NULL;
      UPDATE partners SET image_url = 'https://loremflickr.com/600/400/shawarma'
        WHERE name = 'Bait Al Shawarma' AND image_url IS NULL;
        -- Phase 1 addition: restaurant-panel "temporarily closed" toggle and a basic
      -- dispute-filing channel from restaurant -> admin.
      ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true;

      CREATE TABLE IF NOT EXISTS disputes (
        id UUID PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES partners(id),
        order_id UUID REFERENCES orders(id),
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      -- Phase 1 addition: customer order rating (restaurant + optional review text),
      -- stored directly on the order rather than a separate reviews table at this scale.
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_rating INTEGER;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_review TEXT;

      -- Phase 1 addition: Rider App. Riders are users with role='rider' (see users table
      -- above); rider_profiles holds the extra mutable state that doesn't belong on the
      -- generic users table (online toggle, vehicle, rating). fulfilment_tasks gets a
      -- rider_id so a rider can be matched to exactly the deliveries they claimed, while
      -- rider_name stays as-is for display on the customer tracking page.
      ALTER TABLE fulfilment_tasks ADD COLUMN IF NOT EXISTS rider_id UUID REFERENCES users(id);

      CREATE TABLE IF NOT EXISTS rider_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        vehicle_type TEXT NOT NULL DEFAULT 'motorbike',
        is_online BOOLEAN NOT NULL DEFAULT false,
        rating_avg REAL NOT NULL DEFAULT 5.0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Phase 1 Admin Panel addition: lets an admin resolve a dispute with a note and an
      -- optional refund amount, instead of just open/closed. No real PSP refund is issued
      -- yet (see README "Known items before production") — this records the admin's
      -- decision so support/finance have a paper trail to act on manually.
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution TEXT;
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS refund_amount REAL;
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
    `).then(() => undefined);
  }
  return schemaReady;
}

const id = () => randomUUID();

// ---------- Cities ----------
export async function findOrCreateCity(name: string, country: string, currency: string) {
  await ensureSchema();
  const existing = await pool.query("SELECT * FROM cities WHERE name = $1", [name]);
  if (existing.rows.length) return existing.rows[0];
  const cityId = id();
  await pool.query("INSERT INTO cities (id, name, country, currency) VALUES ($1,$2,$3,$4)", [
    cityId,
    name,
    country,
    currency,
  ]);
  return { id: cityId, name, country, currency };
}

// ---------- Customers ----------
export async function findOrCreateDemoCustomer() {
  await ensureSchema();
  const existing = await pool.query("SELECT * FROM customers LIMIT 1");
  if (existing.rows.length) return existing.rows[0];
  throw new Error("No customer seeded — run `npm run db:seed` first.");
}

export async function seedDemoCustomerIfMissing(cityId: string) {
  await ensureSchema();
  const existing = await pool.query("SELECT * FROM customers LIMIT 1");
  if (existing.rows.length) return existing.rows[0];
  const customerId = id();
  await pool.query(
    "INSERT INTO customers (id, name, email, phone, city_id, loyalty_points) VALUES ($1,$2,$3,$4,$5,$6)",
    [customerId, "Sara A.", "sara@example.com", "+971500000000", cityId, 1240]
  );
  return { id: customerId, name: "Sara A.", email: "sara@example.com" };
}

// ---------- Partners ----------
interface ItemInput {
  category?: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  price: number;
}

export async function createPartner(opts: {
  name: string;
  nameAr?: string | null;
  cuisineTag?: string | null;
  heroEmoji?: string;
  halalVerified?: boolean;
  ratingAvg?: number;
  etaMinsLow?: number;
  etaMinsHigh?: number;
  cityId: string;
  items: ItemInput[];
}) {
  await ensureSchema();
  const partnerId = id();
  await pool.query(
    `INSERT INTO partners (id, partner_type, name, name_ar, cuisine_tag, city_id, halal_verified, status, rating_avg, eta_mins_low, eta_mins_high, hero_emoji)
     VALUES ($1,'restaurant',$2,$3,$4,$5,$6,'approved',$7,$8,$9,$10)`,
    [
      partnerId,
      opts.name,
      opts.nameAr ?? null,
      opts.cuisineTag ?? null,
      opts.cityId,
      opts.halalVerified !== false,
      opts.ratingAvg ?? 4.5,
      opts.etaMinsLow ?? 20,
      opts.etaMinsHigh ?? 35,
      opts.heroEmoji ?? "🍽️",
    ]
  );

  for (const item of opts.items) {
    await pool.query(
      `INSERT INTO catalog_items (id, partner_id, category, name, name_ar, description, price, is_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
      [id(), partnerId, item.category ?? "mains", item.name, item.nameAr ?? null, item.description ?? null, item.price]
    );
  }

  return getPartnerById(partnerId);
}

// Lets a logged-in restaurant owner add a single new item to their own menu,
// outside the bulk-onboarding path createPartner() uses for brand-new restaurants.
export async function addCatalogItem(partnerId: string, item: ItemInput) {
  await ensureSchema();
  const itemId = id();
  await pool.query(
    `INSERT INTO catalog_items (id, partner_id, category, name, name_ar, description, price, is_available)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
    [itemId, partnerId, item.category ?? "mains", item.name, item.nameAr ?? null, item.description ?? null, item.price]
  );
  return itemId;
}

export async function listApprovedPartners() {
  await ensureSchema();
  const result = await pool.query("SELECT * FROM partners WHERE status = 'approved' ORDER BY rating_avg DESC");
  return result.rows.map(toPartnerShape);
}

export async function getPartnerById(partnerId: string) {
  await ensureSchema();
  const partnerRes = await pool.query("SELECT * FROM partners WHERE id = $1", [partnerId]);
  if (!partnerRes.rows.length) return null;
  const partner = partnerRes.rows[0];

  const cityRes = await pool.query("SELECT * FROM cities WHERE id = $1", [partner.city_id]);
  const itemsRes = await pool.query(
    "SELECT * FROM catalog_items WHERE partner_id = $1 AND is_available = true ORDER BY category",
    [partnerId]
  );

  return {
    ...toPartnerShape(partner),
    city: cityRes.rows[0],
    catalogItems: itemsRes.rows.map(toCatalogItemShape),
  };
}

// Map snake_case Postgres columns -> camelCase, matching what the Prisma Client
// equivalent would return, so calling code in API routes/pages never sees the difference.
function toPartnerShape(row: any) {
  return {
    id: row.id,
    partnerType: row.partner_type,
    name: row.name,
    nameAr: row.name_ar,
    cuisineTag: row.cuisine_tag,
    cityId: row.city_id,
    commissionRate: row.commission_rate,
    halalVerified: row.halal_verified,
    status: row.status,
    ratingAvg: row.rating_avg,
    etaMinsLow: row.eta_mins_low,
    etaMinsHigh: row.eta_mins_high,
    heroEmoji: row.hero_emoji,
    heroImageUrl: row.image_url,
    isOpen: row.is_open,
    createdAt: row.created_at,
  };
}

function toCatalogItemShape(row: any) {
  return {
    id: row.id,
    partnerId: row.partner_id,
    category: row.category,
    name: row.name,
    nameAr: row.name_ar,
    description: row.description,
    price: row.price,
    isAvailable: row.is_available,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

// ---------- Orders ----------
export async function getCatalogItemsByIds(ids: string[]) {
  await ensureSchema();
  if (ids.length === 0) return [];
  const result = await pool.query("SELECT * FROM catalog_items WHERE id = ANY($1)", [ids]);
  return result.rows.map(toCatalogItemShape);
}

export async function createOrder(opts: {
  partnerId: string;
  customerId: string;
  deliveryAddress: string;
  paymentMethod: string;
  vertical?: string;
  lines: { catalogItemId: string; quantity: number; name: string; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  riderName?: string;
  etaMins?: number;
}) {
  await ensureSchema();
  const orderId = id();

  await pool.query(
    `INSERT INTO orders (id, vertical, customer_id, partner_id, status, subtotal, delivery_fee, service_fee, total, payment_method, delivery_address)
     VALUES ($1,$2,$3,$4,'placed',$5,$6,$7,$8,$9,$10)`,
    [
      orderId,
      opts.vertical ?? "food",
      opts.customerId,
      opts.partnerId,
      opts.subtotal,
      opts.deliveryFee,
      opts.serviceFee,
      opts.total,
      opts.paymentMethod,
      opts.deliveryAddress,
    ]
  );

  for (const line of opts.lines) {
    await pool.query(
      `INSERT INTO order_items (id, order_id, catalog_item_id, name_snapshot, quantity, unit_price) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id(), orderId, line.catalogItemId, line.name, line.quantity, line.unitPrice]
    );
  }

  await pool.query(
    `INSERT INTO fulfilment_tasks (id, order_id, status, eta_mins) VALUES ($1,$2,'unassigned',$3)`,
    [id(), orderId, opts.etaMins ?? 25]
  );

  return getOrderById(orderId);
}

export async function getOrderById(orderId: string) {
  await ensureSchema();
  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (!orderRes.rows.length) return null;
  const order = orderRes.rows[0];

  const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [orderId]);
  const fulfilmentRes = await pool.query("SELECT * FROM fulfilment_tasks WHERE order_id = $1", [orderId]);
  const partner = await getPartnerById(order.partner_id);

  return {
    id: order.id,
    vertical: order.vertical,
    customerId: order.customer_id,
    partnerId: order.partner_id,
    status: order.status,
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    serviceFee: order.service_fee,
    total: order.total,
    paymentMethod: order.payment_method,
    deliveryAddress: order.delivery_address,
    createdAt: order.created_at,
    customerRating: order.customer_rating,
    customerReview: order.customer_review,
    items: itemsRes.rows.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      catalogItemId: r.catalog_item_id,
      nameSnapshot: r.name_snapshot,
      quantity: r.quantity,
      unitPrice: r.unit_price,
    })),
    fulfilment: fulfilmentRes.rows[0]
      ? {
          id: fulfilmentRes.rows[0].id,
          orderId: fulfilmentRes.rows[0].order_id,
          riderName: fulfilmentRes.rows[0].rider_name,
          status: fulfilmentRes.rows[0].status,
          etaMins: fulfilmentRes.rows[0].eta_mins,
          updatedAt: fulfilmentRes.rows[0].updated_at,
        }
      : null,
    partner,
  };
}

// ---------- Users (Phase 1: auth for restaurant owners and admins) ----------

export async function createUser(opts: {
  email: string;
  passwordHash: string;
  role: "admin" | "restaurant_owner" | "rider";
  name: string;
  partnerId?: string | null;
}) {
  await ensureSchema();
  const userId = id();
  await pool.query(
    `INSERT INTO users (id, email, password_hash, role, name, partner_id) VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, opts.email.toLowerCase(), opts.passwordHash, opts.role, opts.name, opts.partnerId ?? null]
  );
  return getUserById(userId);
}

export async function getUserByEmail(email: string) {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  if (!res.rows.length) return null;
  return toUserShape(res.rows[0]);
}

export async function getUserById(userId: string) {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
  if (!res.rows.length) return null;
  return toUserShape(res.rows[0]);
}

function toUserShape(row: any) {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    name: row.name,
    partnerId: row.partner_id,
    createdAt: row.created_at,
  };
}

// ---------- Restaurant order management (Phase 1) ----------

// Orders for one restaurant's dashboard, most recent first. Excludes nothing by default
// so a new restaurant owner sees their full queue, including already-delivered history.
export async function listOrdersForPartner(partnerId: string) {
  await ensureSchema();
  const ordersRes = await pool.query(
    "SELECT * FROM orders WHERE partner_id = $1 ORDER BY created_at DESC LIMIT 100",
    [partnerId]
  );
  const orders = [];
  for (const order of ordersRes.rows) {
    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    orders.push({
      id: order.id,
      status: order.status,
      total: order.total,
      deliveryAddress: order.delivery_address,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      items: itemsRes.rows.map((r: any) => ({ name: r.name_snapshot, quantity: r.quantity })),
    });
  }
  return orders;
}

// Admin-wide view: every order across every restaurant, most recent first. Distinct from
// listOrdersForPartner, which is scoped to one restaurant owner's own data.
export async function listAllOrders() {
  await ensureSchema();
  const ordersRes = await pool.query(
    `SELECT o.*, p.name AS partner_name FROM orders o
     JOIN partners p ON p.id = o.partner_id
     ORDER BY o.created_at DESC LIMIT 200`
  );
  const orders = [];
  for (const order of ordersRes.rows) {
    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    orders.push({
      id: order.id,
      status: order.status,
      total: order.total,
      partnerName: order.partner_name,
      deliveryAddress: order.delivery_address,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      items: itemsRes.rows.map((r: any) => ({ name: r.name_snapshot, quantity: r.quantity })),
    });
  }
  return orders;
}

const ALLOWED_ORDER_STATUSES = [
  "placed",
  "accepted",
  "rejected",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "picked_up",
  "on_the_way",
  "delivered",
  "cancelled",
];

// Restaurant accept/reject and status progression all go through this single function so
// every transition is validated the same way, rather than each API route writing its own
// ad-hoc UPDATE statement.
export async function updateOrderStatus(orderId: string, newStatus: string) {
  if (!ALLOWED_ORDER_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid order status: ${newStatus}`);
  }
  await ensureSchema();
  const res = await pool.query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING *", [newStatus, orderId]);
  if (!res.rows.length) return null;
  return getOrderById(orderId);
}


// ---------- Restaurant Panel: profile, hours, sales, disputes (Phase 1) ----------

export async function updatePartnerProfile(
  partnerId: string,
  fields: { name?: string; nameAr?: string | null; cuisineTag?: string | null; heroEmoji?: string }
) {
  await ensureSchema();
  await pool.query(
    `UPDATE partners SET
       name = COALESCE($2, name),
       name_ar = COALESCE($3, name_ar),
       cuisine_tag = COALESCE($4, cuisine_tag),
       hero_emoji = COALESCE($5, hero_emoji)
     WHERE id = $1`,
    [partnerId, fields.name ?? null, fields.nameAr ?? null, fields.cuisineTag ?? null, fields.heroEmoji ?? null]
  );
  return getPartnerById(partnerId);
}

export async function setPartnerOpenStatus(partnerId: string, isOpen: boolean) {
  await ensureSchema();
  await pool.query("UPDATE partners SET is_open = $1 WHERE id = $2", [isOpen, partnerId]);
}

// Lightweight sales summary computed directly from orders/order_items — no separate
// analytics table needed at this scale. "This week" = last 7 days by created_at.
export async function getPartnerSalesStats(partnerId: string) {
  await ensureSchema();
  const revenueRes = await pool.query(
    `SELECT COUNT(*)::int AS order_count, COALESCE(SUM(total),0)::float AS revenue
     FROM orders
     WHERE partner_id = $1 AND status = 'delivered' AND created_at >= now() - interval '7 days'`,
    [partnerId]
  );
  const topItemsRes = await pool.query(
    `SELECT oi.name_snapshot AS name, COUNT(*)::int AS qty
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.partner_id = $1 AND o.created_at >= now() - interval '7 days'
     GROUP BY oi.name_snapshot
     ORDER BY qty DESC
     LIMIT 5`,
    [partnerId]
  );
  return {
    orderCount: revenueRes.rows[0].order_count,
    revenue: revenueRes.rows[0].revenue,
    topItems: topItemsRes.rows,
  };
}

export async function createDispute(partnerId: string, message: string, orderId?: string | null) {
  await ensureSchema();
  const disputeId = id();
  await pool.query(
    "INSERT INTO disputes (id, partner_id, order_id, message, status) VALUES ($1,$2,$3,$4,'open')",
    [disputeId, partnerId, orderId ?? null, message]
  );
  return disputeId;
}

export async function listDisputesForPartner(partnerId: string) {
  await ensureSchema();
  const res = await pool.query(
    "SELECT * FROM disputes WHERE partner_id = $1 ORDER BY created_at DESC",
    [partnerId]
  );
  return res.rows.map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
  }));
}

// ---------- Customer order history & rating (Phase 1) ----------

export async function listOrdersForCustomer(customerId: string) {
  await ensureSchema();
  const ordersRes = await pool.query(
    `SELECT o.*, p.name AS partner_name, p.name_ar AS partner_name_ar, p.hero_emoji AS partner_hero_emoji
     FROM orders o
     JOIN partners p ON p.id = o.partner_id
     WHERE o.customer_id = $1
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [customerId]
  );
  const orders = [];
  for (const order of ordersRes.rows) {
    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    orders.push({
      id: order.id,
      status: order.status,
      total: order.total,
      partnerId: order.partner_id,
      partnerName: order.partner_name,
      partnerNameAr: order.partner_name_ar,
      partnerHeroEmoji: order.partner_hero_emoji,
      createdAt: order.created_at,
      customerRating: order.customer_rating,
      items: itemsRes.rows.map((r: any) => ({
        catalogItemId: r.catalog_item_id,
        name: r.name_snapshot,
        quantity: r.quantity,
        unitPrice: r.unit_price,
      })),
    });
  }
  return orders;
}

export async function submitOrderRating(orderId: string, rating: number, review?: string | null) {
  await ensureSchema();
  await pool.query("UPDATE orders SET customer_rating = $1, customer_review = $2 WHERE id = $3", [
    rating,
    review ?? null,
    orderId,
  ]);
  return getOrderById(orderId);
}

// ---------- Rider App (Phase 1) ----------

function toRiderProfileShape(row: any) {
  return {
    userId: row.id ?? row.user_id,
    name: row.name,
    email: row.email,
    vehicleType: row.vehicle_type,
    isOnline: row.is_online,
    ratingAvg: row.rating_avg,
  };
}

// Called right after a rider's first successful login so every rider account ends up with
// a profile row without needing a separate sign-up step (mirrors how restaurant owners
// are created with a row already in place by seed.ts).
export async function ensureRiderProfile(userId: string) {
  await ensureSchema();
  const existing = await pool.query("SELECT * FROM rider_profiles WHERE user_id = $1", [userId]);
  if (!existing.rows.length) {
    await pool.query(
      "INSERT INTO rider_profiles (user_id, vehicle_type, is_online, rating_avg) VALUES ($1,'motorbike',false,5.0) ON CONFLICT (user_id) DO NOTHING",
      [userId]
    );
  }
  return getRiderProfile(userId);
}

export async function getRiderProfile(userId: string) {
  await ensureSchema();
  const res = await pool.query(
    `SELECT u.id, u.name, u.email, rp.vehicle_type, rp.is_online, rp.rating_avg
     FROM users u JOIN rider_profiles rp ON rp.user_id = u.id WHERE u.id = $1`,
    [userId]
  );
  if (!res.rows.length) return null;
  return toRiderProfileShape(res.rows[0]);
}

export async function setRiderOnlineStatus(userId: string, isOnline: boolean) {
  await ensureSchema();
  await pool.query("UPDATE rider_profiles SET is_online = $1, updated_at = now() WHERE user_id = $2", [
    isOnline,
    userId,
  ]);
  return getRiderProfile(userId);
}

export async function updateRiderVehicle(userId: string, vehicleType: string) {
  await ensureSchema();
  await pool.query("UPDATE rider_profiles SET vehicle_type = $1, updated_at = now() WHERE user_id = $2", [
    vehicleType,
    userId,
  ]);
  return getRiderProfile(userId);
}

// Orders a rider can claim: the restaurant has marked them ready and no rider has taken
// them yet. We don't have partner street addresses in Phase 1, so partner name + the
// order's delivery address stand in for pickup/drop-off until a real address/GPS model
// exists (see roadmap doc, "GPS/Location feature").
export async function listAvailableOrdersForRiders() {
  await ensureSchema();
  const res = await pool.query(
    `SELECT o.*, p.name AS partner_name, p.hero_emoji AS partner_hero_emoji
     FROM orders o
     JOIN partners p ON p.id = o.partner_id
     JOIN fulfilment_tasks f ON f.order_id = o.id
     WHERE o.status = 'ready_for_pickup' AND f.rider_id IS NULL
     ORDER BY o.created_at ASC LIMIT 50`
  );
  return res.rows.map((order: any) => ({
    id: order.id,
    total: order.total,
    deliveryFee: order.delivery_fee,
    deliveryAddress: order.delivery_address,
    partnerName: order.partner_name,
    partnerHeroEmoji: order.partner_hero_emoji,
    createdAt: order.created_at,
  }));
}

// Active + history deliveries for one rider, most recent first.
export async function listOrdersForRider(riderId: string) {
  await ensureSchema();
  const res = await pool.query(
    `SELECT o.*, p.name AS partner_name, p.hero_emoji AS partner_hero_emoji
     FROM orders o
     JOIN partners p ON p.id = o.partner_id
     JOIN fulfilment_tasks f ON f.order_id = o.id
     WHERE f.rider_id = $1
     ORDER BY o.created_at DESC LIMIT 100`,
    [riderId]
  );
  return res.rows.map((order: any) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    deliveryFee: order.delivery_fee,
    deliveryAddress: order.delivery_address,
    partnerName: order.partner_name,
    partnerHeroEmoji: order.partner_hero_emoji,
    createdAt: order.created_at,
  }));
}

// A rider claims an unassigned, ready order. Race-safe via the `rider_id IS NULL` guard:
// if two riders tap "accept" on the same order at once, only the first UPDATE matches a
// row — the second gets 0 rows back and the API route reports it as already taken instead
// of double-assigning the same delivery.
export async function assignRiderToOrder(orderId: string, riderId: string, riderName: string) {
  await ensureSchema();
  const res = await pool.query(
    `UPDATE fulfilment_tasks SET rider_id = $1, rider_name = $2, status = 'assigned', updated_at = now()
     WHERE order_id = $3 AND rider_id IS NULL RETURNING *`,
    [riderId, riderName, orderId]
  );
  if (!res.rows.length) return null;
  await pool.query("UPDATE orders SET status = 'rider_assigned' WHERE id = $1", [orderId]);
  return getOrderById(orderId);
}

const RIDER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  rider_assigned: ["picked_up", "cancelled"],
  picked_up: ["on_the_way"],
  on_the_way: ["delivered"],
};

const RIDER_FULFILMENT_STATUS: Record<string, string> = {
  picked_up: "picked_up",
  on_the_way: "en_route",
  delivered: "delivered",
  cancelled: "cancelled",
};

// Mirrors updateOrderStatus's role as the single validated entry point, but scoped to the
// rider-owned portion of the lifecycle (rider_assigned -> picked_up -> on_the_way ->
// delivered) and checked against fulfilment_tasks.rider_id so a rider can only move
// deliveries they themselves claimed.
export async function updateRiderOrderStatus(orderId: string, riderId: string, newStatus: string) {
  await ensureSchema();
  const fRes = await pool.query("SELECT * FROM fulfilment_tasks WHERE order_id = $1", [orderId]);
  if (!fRes.rows.length || fRes.rows[0].rider_id !== riderId) return null;

  const order = await getOrderById(orderId);
  if (!order) return null;

  const allowedNext = RIDER_ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(`Cannot move order from "${order.status}" to "${newStatus}"`);
  }

  await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [newStatus, orderId]);
  await pool.query("UPDATE fulfilment_tasks SET status = $1, updated_at = now() WHERE order_id = $2", [
    RIDER_FULFILMENT_STATUS[newStatus] ?? newStatus,
    orderId,
  ]);
  return getOrderById(orderId);
}

// Earnings computed directly from delivered orders (rider keeps the order's full
// delivery_fee) — same "no separate ledger table at this scale" approach as
// getPartnerSalesStats, until a real payout/ledger system exists.
export async function getRiderEarnings(riderId: string) {
  await ensureSchema();
  const totalsRes = await pool.query(
    `SELECT COUNT(*)::int AS delivery_count, COALESCE(SUM(o.delivery_fee),0)::float AS total_earnings
     FROM orders o JOIN fulfilment_tasks f ON f.order_id = o.id
     WHERE f.rider_id = $1 AND o.status = 'delivered'`,
    [riderId]
  );
  const todayRes = await pool.query(
    `SELECT COUNT(*)::int AS delivery_count, COALESCE(SUM(o.delivery_fee),0)::float AS earnings
     FROM orders o JOIN fulfilment_tasks f ON f.order_id = o.id
     WHERE f.rider_id = $1 AND o.status = 'delivered' AND o.created_at >= date_trunc('day', now())`,
    [riderId]
  );
  const weekRes = await pool.query(
    `SELECT COUNT(*)::int AS delivery_count, COALESCE(SUM(o.delivery_fee),0)::float AS earnings
     FROM orders o JOIN fulfilment_tasks f ON f.order_id = o.id
     WHERE f.rider_id = $1 AND o.status = 'delivered' AND o.created_at >= now() - interval '7 days'`,
    [riderId]
  );
  return {
    totalEarnings: totalsRes.rows[0].total_earnings,
    totalDeliveries: totalsRes.rows[0].delivery_count,
    today: { earnings: todayRes.rows[0].earnings, deliveries: todayRes.rows[0].delivery_count },
    week: { earnings: weekRes.rows[0].earnings, deliveries: weekRes.rows[0].delivery_count },
  };
}


// ---------- Admin Panel (Phase 1) ----------

// Every partner regardless of status, for the admin approval queue — listApprovedPartners
// (used by the customer-facing site) deliberately only returns status='approved'.
export async function listAllPartnersForAdmin() {
  await ensureSchema();
  const res = await pool.query(
    `SELECT p.*, c.name AS city_name FROM partners p
     LEFT JOIN cities c ON c.id = p.city_id
     ORDER BY p.created_at DESC`
  );
  return res.rows.map((row: any) => ({ ...toPartnerShape(row), cityName: row.city_name }));
}

const ALLOWED_PARTNER_STATUSES = ["pending", "approved", "suspended"];

export async function setPartnerStatus(partnerId: string, status: string) {
  if (!ALLOWED_PARTNER_STATUSES.includes(status)) {
    throw new Error(`Invalid partner status: ${status}`);
  }
  await ensureSchema();
  const res = await pool.query("UPDATE partners SET status = $1 WHERE id = $2 RETURNING *", [status, partnerId]);
  if (!res.rows.length) return null;
  return getPartnerById(partnerId);
}

// All non-customer accounts (admin/restaurant_owner/rider), for the admin User
// Management tab. Password hashes are intentionally never selected here.
export async function listAllUsers() {
  await ensureSchema();
  const res = await pool.query(
    `SELECT u.id, u.email, u.role, u.name, u.partner_id, u.created_at,
            p.name AS partner_name, rp.is_online AS rider_is_online
     FROM users u
     LEFT JOIN partners p ON p.id = u.partner_id
     LEFT JOIN rider_profiles rp ON rp.user_id = u.id
     ORDER BY u.created_at DESC`
  );
  return res.rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    riderIsOnline: row.rider_is_online,
    createdAt: row.created_at,
  }));
}

// Riders currently online, with whatever delivery (if any) they're carrying right now —
// the closest thing to a "live rider map" Phase 1 can offer without real GPS coordinates
// (see roadmap doc, "GPS/Location feature"). Shows the delivery address as a text stand-in
// for a map pin.
export async function listOnlineRidersForAdmin() {
  await ensureSchema();
  const res = await pool.query(
    `SELECT u.id, u.name, u.email, rp.vehicle_type, rp.rating_avg,
            o.id AS order_id, o.status AS order_status, o.delivery_address, p.name AS partner_name
     FROM users u
     JOIN rider_profiles rp ON rp.user_id = u.id
     LEFT JOIN fulfilment_tasks f ON f.rider_id = u.id AND f.status IN ('assigned','picked_up','en_route')
     LEFT JOIN orders o ON o.id = f.order_id
     LEFT JOIN partners p ON p.id = o.partner_id
     WHERE rp.is_online = true
     ORDER BY u.name`
  );
  return res.rows.map((row: any) => ({
    riderId: row.id,
    name: row.name,
    email: row.email,
    vehicleType: row.vehicle_type,
    ratingAvg: row.rating_avg,
    activeOrderId: row.order_id,
    activeOrderStatus: row.order_status,
    activeDeliveryAddress: row.delivery_address,
    activePartnerName: row.partner_name,
  }));
}

// Every dispute across every restaurant, most recent first — the admin counterpart to
// listDisputesForPartner, which is scoped to one restaurant owner's own filings.
export async function listAllDisputesForAdmin() {
  await ensureSchema();
  const res = await pool.query(
    `SELECT d.*, p.name AS partner_name FROM disputes d
     JOIN partners p ON p.id = d.partner_id
     ORDER BY d.created_at DESC LIMIT 200`
  );
  return res.rows.map((r: any) => ({
    id: r.id,
    partnerId: r.partner_id,
    partnerName: r.partner_name,
    orderId: r.order_id,
    message: r.message,
    status: r.status,
    resolution: r.resolution,
    refundAmount: r.refund_amount,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  }));
}

export async function resolveDispute(disputeId: string, resolution: string, refundAmount?: number | null) {
  await ensureSchema();
  await pool.query(
    `UPDATE disputes SET status = 'resolved', resolution = $1, refund_amount = $2, resolved_at = now() WHERE id = $3`,
    [resolution, refundAmount ?? null, disputeId]
  );
  const res = await pool.query(
    `SELECT d.*, p.name AS partner_name FROM disputes d JOIN partners p ON p.id = d.partner_id WHERE d.id = $1`,
    [disputeId]
  );
  if (!res.rows.length) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    partnerId: r.partner_id,
    partnerName: r.partner_name,
    orderId: r.order_id,
    message: r.message,
    status: r.status,
    resolution: r.resolution,
    refundAmount: r.refund_amount,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  };
}

// Platform-wide numbers for the admin Analytics tab — same "compute straight from
// orders, no separate analytics table" approach as getPartnerSalesStats, just without the
// partner_id filter.
export async function getPlatformAnalytics() {
  await ensureSchema();
  const totalsRes = await pool.query(
    `SELECT COUNT(*)::int AS order_count, COALESCE(SUM(total),0)::float AS revenue,
            COALESCE(SUM(delivery_fee),0)::float AS rider_payouts,
            COALESCE(SUM(subtotal * (SELECT AVG(commission_rate) FROM partners)),0)::float AS est_commission
     FROM orders WHERE status = 'delivered'`
  );
  const weekRes = await pool.query(
    `SELECT COUNT(*)::int AS order_count, COALESCE(SUM(total),0)::float AS revenue
     FROM orders WHERE status = 'delivered' AND created_at >= now() - interval '7 days'`
  );
  const topPartnersRes = await pool.query(
    `SELECT p.name, COUNT(*)::int AS order_count, COALESCE(SUM(o.total),0)::float AS revenue
     FROM orders o JOIN partners p ON p.id = o.partner_id
     WHERE o.status = 'delivered'
     GROUP BY p.name ORDER BY revenue DESC LIMIT 5`
  );
  const riderCountRes = await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_online)::int AS online FROM rider_profiles`
  );
  const partnerCountRes = await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
     FROM partners`
  );
  return {
    totalOrders: totalsRes.rows[0].order_count,
    totalRevenue: totalsRes.rows[0].revenue,
    riderPayouts: totalsRes.rows[0].rider_payouts,
    weekOrders: weekRes.rows[0].order_count,
    weekRevenue: weekRes.rows[0].revenue,
    topPartners: topPartnersRes.rows,
    riders: { total: riderCountRes.rows[0].total, online: riderCountRes.rows[0].online },
    partners: {
      total: partnerCountRes.rows[0].total,
      approved: partnerCountRes.rows[0].approved,
      pending: partnerCountRes.rows[0].pending,
    },
  };
}

