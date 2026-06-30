import { NextResponse } from "next/server";
import { getPartnerById, getCatalogItemsByIds, createOrder, findOrCreateDemoCustomer } from "@/lib/db";
import { computePriceBreakdown } from "@/lib/pricing";

interface CreateOrderBody {
  partnerId: string;
  deliveryAddress: string;
  paymentMethod: string;
  lines: { catalogItemId: string; quantity: number }[];
}

export async function POST(req: Request) {
  const body: CreateOrderBody = await req.json();

  if (!body.partnerId || !body.lines?.length) {
    return NextResponse.json({ error: "partnerId and at least one line item are required" }, { status: 400 });
  }

  const partner = await getPartnerById(body.partnerId);
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const catalogItems = await getCatalogItemsByIds(body.lines.map((l) => l.catalogItemId));

  // Price is always recomputed server-side from the current catalog price, never taken
  // from the client — this is what keeps "no surge, no surprise fees" a guarantee rather
  // than a UI claim that a modified request could bypass.
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
