"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PurchaseStockModal } from "./PurchaseStockModal";
import { Button } from "@/components/ui/button";

export function InventoryDashboard() {
  const [filter, setFilter] = useState<"ALL" | "DYE" | "CHEMICAL" | "AUXILIARY">("ALL");
  
  // Use Convex query
  const rawItems = useQuery(api.inventory.getItems, filter !== "ALL" ? { category: filter as any } : {});

  if (rawItems === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-muted-foreground animate-pulse">Loading Inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage your stateful floor stock and item levels.</p>
        </div>
        <div className="flex gap-2">
          <PurchaseStockModal />
        </div>
      </div>

      <div className="flex gap-2">
        {(["ALL", "DYE", "CHEMICAL", "AUXILIARY"] as const).map(cat => (
          <Button 
            key={cat} 
            variant={filter === cat ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Item Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Available (Consuming UoM)</th>
                <th className="px-4 py-3 font-medium">Reserved</th>
                <th className="px-4 py-3 font-medium text-right">Moving Average Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rawItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No items found in this category.
                  </td>
                </tr>
              ) : (
                rawItems.map((item) => {
                  const isLowStock = item.availableStock <= item.reorderLevel;
                  return (
                    <tr key={item._id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {item.name}
                        {isLowStock && <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">Low Stock</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{item.availableStock.toFixed(2)}</span> {item.consumingUoM}
                      </td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-500">
                        {item.reservedStock > 0 ? `${item.reservedStock.toFixed(2)} ${item.consumingUoM}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        ৳{item.movingAveragePrice.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
