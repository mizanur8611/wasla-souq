import { getOrderById } from "@/lib/db";
import { notFound } from "next/navigation";
import OrderTracker from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);

  if (!order || !order.partner) notFound();

  return <OrderTracker orderId={params.id} initialOrder={order} />;
}

