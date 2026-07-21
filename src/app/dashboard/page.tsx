"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PaymentsChartWidget, TopDebtorsWidget, PendingOrdersWidget, LedgerSummaryWidget, CustomerBillsWidget } from "./components/DashboardWidgets";
import { Loader2, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import dayjs from "dayjs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardIndexPage() {
  const [customerId, setCustomerId] = useState<string>("all");
  const [dateRangeOption, setDateRangeOption] = useState<string>("all");

  const filters = useQuery(api.dashboardQueries.getDashboardFilters);

  // Compute actual date range
  let dateRange = undefined;
  if (dateRangeOption === "last7") {
    dateRange = { from: dayjs().subtract(7, "day").valueOf(), to: dayjs().valueOf() };
  } else if (dateRangeOption === "last30") {
    dateRange = { from: dayjs().subtract(30, "day").valueOf(), to: dayjs().valueOf() };
  } else if (dateRangeOption === "thisYear") {
    dateRange = { from: dayjs().startOf("year").valueOf(), to: dayjs().valueOf() };
  }

  const dashboardData = useQuery(api.dashboardQueries.getDashboardData, {
    customerId: customerId === "all" ? undefined : customerId,
    dateRange
  });

  if (dashboardData === undefined || filters === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] bg-[#f7f7f4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#26251e]/50" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7f7f4] font-sans selection:bg-[#26251e]/10">
      <div className="p-6 md:p-8 max-w-[1300px] mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-[#26251e]">Dashboard</h1>
            <p className="text-[#26251e]/60 text-sm mt-1">Overview of your financial and operational metrics</p>
          </div>
          
          <div className="flex items-center gap-3 bg-[#f2f1ed] p-2 rounded-lg border border-[#26251e]/10 shadow-sm z-50">
            <Filter className="w-4 h-4 text-[#26251e]/50 ml-2" />
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="w-[180px] h-9 bg-white border-[#26251e]/10 text-xs text-[#26251e] shadow-none">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {filters.customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRangeOption} onValueChange={setDateRangeOption}>
              <SelectTrigger className="w-[140px] h-9 bg-white border-[#26251e]/10 text-xs text-[#26251e] shadow-none">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Row / Main Grid */}
          <PaymentsChartWidget total={dashboardData.totalPaymentsReceived} paymentsChartData={dashboardData.paymentsChartData} />
          <TopDebtorsWidget debtors={dashboardData.topDebtors} />
          <LedgerSummaryWidget unbilledOrders={dashboardData.unbilledOrders} />

          {/* Middle Row */}
          <PendingOrdersWidget orders={dashboardData.pendingOrders} />

          {/* Bottom Row spans full width */}
          <CustomerBillsWidget customerBills={dashboardData.customerBills} />
        </div>
      </div>
    </div>
  );
}
