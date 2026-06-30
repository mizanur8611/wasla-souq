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
  role: "admin" | "restaurant_owner";
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
