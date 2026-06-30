import { NextResponse } from "next/server";
import { getPartnerById, getCatalogItemsByIds, createOrder, findOrCreateDemoCustomer, listOrdersForCustomer } from "@/lib/db";
import { computePriceBreakdown } from "@/lib/pricing";

interface CreateOrderBody {
  partnerId: string;
  deliveryAddress: string;
  paymentMethod: string;
  lines: { catalogItemId: string; quantity: number }[];
}

export const dynamic = "force-dynamic";

// Phase 1 has a single seeded demo customer (no real customer auth yet), so "my orders"
// means this customer's orders — the same scoping createOrder already uses.
export async function GET() {
  const customer = await findOrCreateDemoCustomer();
  const orders = await listOrdersForCustomer(customer.id);
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const body: CreateOrderBody = await req.json();

  if (!body.partnerId || !body.lines?.length) {
    return NextResponse.json({ error: "partnerId and at least one line item are required" }, { status: 400 });
  }

  const partner = await getPartnerById(body.partnerId);
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const catalogItems = await getCatalogItemsByIds(body.lines.map((l) => l.catalogItemId));

  let subtotal = 0;
  const lines = body.lines.map((line) => {
    const item = catalogItems.find((c: any) => c.id === line.catalogItemId);
    if (!item) throw new Error(`Catalog item ${line.catalogItemId} not found`);
    subtotal += item.price * line.quantity;
    return { catalogItemId: item.id, name: item.name, quantity: line.quantity, unitPrice: item.price };
  });

  const breakdown = computePriceBreakdown(subtotal, partner.city.currency);
  const customer = await findOrCreateDemoCustomer();

  const order = await createOrder({
    partnerId: partner.id,
    customerId: customer.id,
    deliveryAddress: body.deliveryAddress || "Saved address",
    paymentMethod: body.paymentMethod || "card",
    vertical: "food",
    lines,
    subtotal: breakdown.subtotal,
    deliveryFee: breakdown.deliveryFee,
    serviceFee: breakdown.serviceFee,
    total: breakdown.total,
  });

  return NextResponse.json(order, { status: 201 });
}

