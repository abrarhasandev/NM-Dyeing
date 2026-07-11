"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Filter, FileText, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  const transactions = useQuery(api.inventory.getTransactions, {
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined
  });

  const chemicals = useQuery(api.inventory.getChemicals);

  const getChemicalName = (id) => {
    return chemicals?.find(c => c._id === id)?.name || id;
  };

  const getChemicalUom = (id) => {
    return chemicals?.find(c => c._id === id)?.uom || "";
  };

  const exportToCSV = () => {
    if (!transactions) return;
    
    const headers = ["Date", "Type", "Chemical", "Quantity", "UoM", "Job Order", "Machine", "Shift"];
    const rows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      getChemicalName(tx.chemicalId),
      tx.quantity,
      getChemicalUom(tx.chemicalId),
      tx.jobOrderId || "-",
      tx.machineId || "-",
      tx.shift || "-"
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chemical_consumption_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotalConsumption = () => {
    if (!transactions) return 0;
    return transactions
      .filter(tx => tx.type === "Issue")
      .reduce((acc, curr) => acc + Math.abs(curr.quantity), 0);
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Advanced Reporting
          </h2>
          <p className="text-muted-foreground mt-2">
            Consumption analytics, costing reports, and data export.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white shadow-sm" onClick={() => window.print()}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Select date range for reports</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                className="px-3 py-2 border rounded-md text-sm outline-none dark:bg-zinc-950 dark:border-zinc-800"
              />
              <span className="text-zinc-500">to</span>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                className="px-3 py-2 border rounded-md text-sm outline-none dark:bg-zinc-950 dark:border-zinc-800"
              />
            </div>
            <Button variant="secondary" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Apply Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-blue-800 dark:text-blue-300 font-medium text-sm">Total Volume Issued (Filtered)</h4>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{calculateTotalConsumption().toLocaleString()} <span className="text-lg">units</span></p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <h4 className="text-red-800 dark:text-red-300 font-medium text-sm">Total Waste Logged (Filtered)</h4>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                {transactions?.filter(tx => tx.type === 'Waste').reduce((acc, curr) => acc + Math.abs(curr.quantity), 0).toLocaleString()} <span className="text-lg">units</span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-zinc-900 dark:text-zinc-50">Transaction History</h3>
            {transactions === undefined || chemicals === undefined ? (
              <div className="py-8 text-center text-muted-foreground">Loading report data...</div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                No transactions found in this date range.
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/80 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Transaction Type</th>
                      <th className="px-6 py-4 font-medium">Chemical</th>
                      <th className="px-6 py-4 font-medium text-right">Quantity</th>
                      <th className="px-6 py-4 font-medium">Job/Machine/Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'Stock In' ? 'bg-green-100 text-green-700' : tx.type === 'Issue' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {getChemicalName(tx.chemicalId)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={tx.quantity > 0 ? "text-green-600 font-medium" : "text-zinc-900 font-medium dark:text-zinc-100"}>
                            {tx.quantity > 0 ? '+' : ''}{tx.quantity} {getChemicalUom(tx.chemicalId)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">
                          <div className="flex gap-2 flex-wrap">
                            {tx.jobOrderId && <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs">Job: {tx.jobOrderId}</span>}
                            {tx.machineId && <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs">M/C: {tx.machineId}</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
