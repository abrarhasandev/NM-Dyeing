import { OrdersContent } from "@/components/order/OrdersContent";
import { Suspense } from "react";
import OrderSkeleton from "@/components/order/OrderSkeleton";

export default function Orders() {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}
