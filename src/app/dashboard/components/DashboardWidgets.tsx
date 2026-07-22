"use client";

import { CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DollarSign, FileText, CheckCircle, Clock, Banknote, TrendingUpIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import dayjs from "dayjs";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/reui/badge";



const chartConfig = {
  total: { label: "Payments", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PaymentsChartWidget({ total, paymentsChartData }: { total: number, paymentsChartData: any[] }) {
  return (
    <Card className="col-span-1 border border-[#26251e]/10 bg-[#f7f7f4] shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[#26251e] font-sans font-medium text-lg">
          <Banknote className="w-5 h-5 text-[#1f8a65]" />
          Total Received
          {paymentsChartData.length > 0 && paymentsChartData[paymentsChartData.length - 1].total > 0 && (
            <Badge variant="success-light" className="ml-2 font-mono">
              <TrendingUpIcon aria-hidden="true" className="w-3 h-3 mr-1" />
              Up
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-[#26251e]/60 text-xs">Customer Payments Over Time</CardDescription>
        <div className="flex flex-col mt-2">
          <span className="text-3xl font-bold tracking-tight text-[#26251e]">
            ৳ {total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <ChartContainer config={chartConfig} className="w-full h-[120px]">
          <AreaChart
            accessibilityLayer
            data={paymentsChartData}
            margin={{ top: 10, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="chart-total" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1f8a65" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1f8a65" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              style={{ fontSize: '10px', fill: '#26251e', opacity: 0.5 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-32 gap-2"
                  formatter={(value) => (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-foreground font-semibold tabular-nums text-xs">
                        ৳ {Number(value).toLocaleString()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="total"
              type="natural"
              fill="url(#chart-total)"
              fillOpacity={1}
              stroke="#1f8a65"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TopDebtorsWidget({ debtors }: { debtors: any[] }) {
  return (
    <Card className="col-span-1 border border-[#26251e]/10 bg-[#f7f7f4] shadow-sm rounded-xl">
      <CardHeader className="pb-4 border-b border-[#26251e]/5">
        <CardTitle className="flex items-center gap-2 text-[#26251e] font-sans font-medium text-lg">
          <DollarSign className="w-5 h-5 text-[#f54e00]" />
          Top Debtors
        </CardTitle>
        <CardDescription className="text-[#26251e]/60 text-xs">Highest outstanding balances</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {debtors.map((debtor, i) => (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={debtor.mongoId}
              className="flex items-center justify-between p-3 rounded-lg bg-[#f2f1ed] border border-[#26251e]/5 hover:bg-[#ebeae5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-1 ring-[#26251e]/10">
                  <AvatarFallback className="bg-[#e6e5e0] text-[#26251e] font-bold text-xs">
                    {debtor.companyName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-[#26251e] leading-none">{debtor.companyName}</p>
                  <p className="text-xs text-[#26251e]/60 mt-1">
                    {Array.isArray(debtor.phoneNumber) 
                      ? debtor.phoneNumber.map((p: any) => p.number).join(', ') 
                      : (typeof debtor.phoneNumber === 'string' ? debtor.phoneNumber : "—")}
                  </p>
                </div>
              </div>
              <div className="font-semibold text-[#f54e00] text-sm">
                ৳ {debtor.balance.toLocaleString()}
              </div>
            </motion.div>
          ))}
          {debtors.length === 0 && (
            <div className="text-center text-[#26251e]/50 py-4 text-sm font-mono">No debtors found</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PendingOrdersWidget({ orders }: { orders: any[] }) {
  return (
    <Card className="col-span-1 lg:col-span-2 border border-[#26251e]/10 bg-[#f7f7f4] shadow-sm rounded-xl">
      <CardHeader className="pb-4 border-b border-[#26251e]/5">
        <CardTitle className="flex items-center gap-2 text-[#26251e] font-sans font-medium text-lg">
          <Clock className="w-5 h-5 text-[#c08532]" />
          Pending Orders
        </CardTitle>
        <CardDescription className="text-[#26251e]/60 text-xs">Orders awaiting completion in sequence</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-[#26251e]/10 before:to-transparent">
          {orders.map((order, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={order.mongoId}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#26251e]/10 bg-[#ebeae5] text-[#26251e]/60 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg bg-[#f2f1ed] border border-[#26251e]/5 hover:bg-[#ebeae5] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#26251e] text-sm">
                    {order.displayOrderId || order.orderId}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#e6e5e0] text-[#26251e]/80">
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-[#26251e]/80 mb-1 truncate">{order.companyName}</div>
                <div className="text-xs text-[#26251e]/50">
                  {dayjs(order.date || order.createdAt).format("DD MMM YYYY")}
                </div>
              </div>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div className="text-center text-[#26251e]/50 py-4 text-sm font-mono z-10 relative bg-[#f7f7f4]">No pending orders</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LedgerSummaryWidget({ unbilledOrders }: { unbilledOrders: any }) {
  return (
    <Card className="col-span-1 border border-[#26251e]/10 bg-[#f7f7f4] shadow-sm rounded-xl">
      <CardHeader className="pb-4 border-b border-[#26251e]/5">
        <CardTitle className="flex items-center gap-2 text-[#26251e] font-sans font-medium text-lg">
          <FileText className="w-5 h-5 text-[#3a6a9f]" />
          Ledger Statement
        </CardTitle>
        <CardDescription className="text-[#26251e]/60 text-xs">Orders pending invoice generation</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col items-center justify-center p-6 bg-[#f2f1ed] rounded-xl border border-[#26251e]/5 mb-6">
          <span className="text-5xl font-mono text-[#26251e]">{unbilledOrders.count}</span>
          <span className="text-[11px] uppercase tracking-widest text-[#26251e]/60 mt-3 font-semibold">Unbilled Orders</span>
        </div>
        
        <h4 className="text-xs font-mono uppercase tracking-widest mb-3 text-[#26251e]/50">Recent Unbilled</h4>
        <div className="space-y-2">
          {unbilledOrders.items.map((order: any, i: number) => (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={order.mongoId}
              className="flex justify-between items-center p-2.5 text-sm rounded-md bg-[#f2f1ed] border border-[#26251e]/5 hover:bg-[#ebeae5] transition-colors"
            >
              <div className="flex flex-col truncate pr-2">
                <span className="font-medium text-[#26251e] truncate">{order.displayOrderId || order.orderId}</span>
                <span className="text-xs text-[#26251e]/60 truncate">{order.companyName}</span>
              </div>
              <span className="shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#e6e5e0] rounded text-[#26251e]/80">
                {order.status}
              </span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerBillsWidget({ customerBills }: { customerBills: any[] }) {
  return (
    <Card className="col-span-1 lg:col-span-3 border border-[#26251e]/10 bg-[#f7f7f4] shadow-sm rounded-xl">
      <CardHeader className="pb-4 border-b border-[#26251e]/5">
        <CardTitle className="flex items-center gap-2 text-[#26251e] font-sans font-medium text-lg">
          <CheckCircle className="w-5 h-5 text-[#1f8a65]" />
          Customer Bills
        </CardTitle>
        <CardDescription className="text-[#26251e]/60 text-xs">Organized billing history by customer</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customerBills.map((cb, i) => (
            <CustomerBillAccordion key={cb.customerMongoId} cb={cb} index={i} />
          ))}
          {customerBills.length === 0 && (
            <div className="col-span-full text-center text-[#26251e]/50 py-8 text-sm font-mono">No bills found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerBillAccordion({ cb, index }: { cb: any; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border border-[#26251e]/10 rounded-lg bg-[#f2f1ed] overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between p-3.5 hover:bg-[#ebeae5] transition-colors cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 ring-1 ring-[#26251e]/10">
              <AvatarFallback className="bg-[#e6e5e0] text-[#26251e] font-bold text-xs">
                {cb.companyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#26251e] truncate max-w-[150px]">{cb.companyName}</span>
              <span className="text-xs font-mono text-[#26251e]/60">{cb.invoices.length} Invoices</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-[#26251e]/50 hover:text-[#26251e] hover:bg-transparent">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CollapsibleContent>
          <div className="p-2 space-y-1.5 bg-[#ebeae5]/50 border-t border-[#26251e]/5 max-h-52 overflow-y-auto">
            {cb.invoices.map((inv: any) => (
              <div key={inv.mongoId} className="flex justify-between items-center p-2 rounded bg-[#f7f7f4] border border-[#26251e]/5 text-xs hover:border-[#26251e]/20 transition-colors">
                <span className="font-medium text-[#26251e] font-mono">{inv.invoiceNumber}</span>
                <span className="font-semibold text-[#1f8a65]">৳ {inv.totalCharge?.toLocaleString() || 0}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
