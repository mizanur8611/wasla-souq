import { getOrderById } from "@/lib/db";
import { notFound } from "next/navigation";
import OrderStatus from "@/components/OrderStatus";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);

  if (!order || !order.partner) notFound();

  return <OrderStatus order={order as any} />;
}