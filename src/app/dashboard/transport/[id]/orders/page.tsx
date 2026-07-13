"use client";

import React, { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { OrdersContent } from "@/components/order/OrdersContent";
import { Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useDocumentTitle } from "@/hook/useDocumentTitle";

import { Id } from "../../../../../../convex/_generated/dataModel";

export default function TransportOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const employeeId = unwrappedParams.id as Id<"transportEmployees">;
  const employee = useQuery(api.transportEmployees.getEmployeeById, { id: employeeId });

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
          <Link href={`/dashboard/transport/profile/${employee._id}`}>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-sm hover:opacity-80 transition-opacity cursor-pointer">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-primary">
                  {employee.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.name}'s Orders</h1>
          </div>
        </div>
      </div>
      <div className="flex-1 mt-4">
        <OrdersContent
          transporterName={employee.name}
          isTransportMode
          transportEmployeeId={employee._id}
        />
      </div>
    </div>
  );
}
