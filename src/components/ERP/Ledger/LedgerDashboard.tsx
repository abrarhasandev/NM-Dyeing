"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function LedgerDashboard() {
  const ledgerEntries = useQuery(api.inventory.getLedgerEntries, {});

  if (ledgerEntries === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-muted-foreground animate-pulse">Loading Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Stock Ledger</h2>
          <p className="text-sm text-muted-foreground">Historical transaction log of all inventory movements.</p>
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Item Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Transaction Type</th>
                <th className="px-4 py-3 font-medium text-right">Quantity</th>
                <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No transactions found in the ledger.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{entry.itemName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.itemCategory}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                        ${entry.transactionType === "PURCHASE_IN" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          entry.transactionType === "CONSUME_ACTUAL" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                          entry.transactionType === "RESERVE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {entry.transactionType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {entry.transactionType === "PURCHASE_IN" || entry.transactionType === "RELEASE_RESERVE" || entry.transactionType === "AUDIT_ADJUSTMENT" ? "+" : "-"}
                      {entry.quantity.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {entry.unitCostAtTransaction ? `৳${entry.unitCostAtTransaction.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]" title={entry.note || ""}>
                      {entry.note || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
