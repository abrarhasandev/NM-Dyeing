import { OrdersContent } from "@/components/order/OrdersContent";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function TrashOrders() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/order"
          className="p-1.5 hover:bg-accent rounded-full transition-colors text-muted-foreground/70 hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[18px] font-bold text-foreground">Trash Orders</h1>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <NuqsAdapter>
          <OrdersContent isTrashMode={true} />
        </NuqsAdapter>
      </Suspense>
    </div>
  );
}
