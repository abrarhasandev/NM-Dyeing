"use client";

import React, { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { OrdersContent } from "@/components/order/OrdersContent";
import { Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useDocumentTitle } from "@/hook/useDocumentTitle";

export default function TransportOrdersPage({ params }) {
  const unwrappedParams = use(params);
  const employee = useQuery(api.transportEmployees.getById, { id: unwrappedParams.id });

  useDocumentTitle(employee ? `Orders - ${employee.name}` : "Transport Orders");

  if (employee === undefined) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
  if (employee === null) return (
    <div className="p-8 text-center text-red-500 font-medium">
      Employee not found
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4 pt-4 px-4 md:px-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/transport" className="p-2 hover:bg-accent rounded-full transition-colors border border-transparent hover:border-border">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 shadow-sm">
            <Truck className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.name}'s Orders</h1>
          </div>
        </div>
      </div>
      <div className="flex-1 mt-4">
        <OrdersContent transporterName={employee.name} />
      </div>
    </div>
  );
}
