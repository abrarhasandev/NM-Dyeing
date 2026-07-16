// @ts-nocheck
import React from "react";
import { Truck } from "lucide-react";

export default function TransportLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* HEADER SECTION SKELETON */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-muted p-2.5 rounded-md w-12 h-12 shrink-0"></div>
              <div className="h-8 bg-muted rounded-md w-64"></div>
            </div>
          </div>
          <div className="h-10 w-40 bg-muted rounded-md"></div>
        </div>

        {/* STATS SECTION SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-6 rounded-lg border border-border shadow-sm h-[130px] flex flex-col justify-between">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-10 w-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>

        {/* SEARCH BAR SKELETON */}
        <div className="relative max-w-md h-10 bg-muted rounded-md border border-border"></div>

        {/* TABLE SECTION SKELETON */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 h-12 bg-muted/30"></th>
                  <th className="px-6 py-4 h-12 bg-muted/30"></th>
                  <th className="px-6 py-4 h-12 bg-muted/30"></th>
                  <th className="px-6 py-4 h-12 bg-muted/30"></th>
                  <th className="px-6 py-4 h-12 bg-muted/30"></th>
                  <th className="px-6 py-4 h-12 bg-muted/30"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-10 w-32 bg-muted rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-muted rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-48 bg-muted rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-muted rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-muted rounded-md"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-muted rounded-md ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
