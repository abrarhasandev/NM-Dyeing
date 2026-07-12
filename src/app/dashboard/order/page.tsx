import { OrdersContent } from "@/components/order/OrdersContent";
import { Suspense } from "react";
import OrderSkeleton from "@/components/order/OrderSkeleton";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function Orders() {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <NuqsAdapter>
        <OrdersContent />
      </NuqsAdapter>
    </Suspense>
  );
}
