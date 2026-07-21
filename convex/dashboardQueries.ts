import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDashboardFilters = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    return {
      customers: customers.map(c => ({
        id: c.mongoId,
        name: c.companyName || "Unknown Customer"
      })).sort((a, b) => a.name.localeCompare(b.name))
    };
  }
});

export const getDashboardData = query({
  args: {
    customerId: v.optional(v.string()),
    dateRange: v.optional(
      v.object({
        from: v.number(),
        to: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { customerId, dateRange } = args;

    // 1. Fetch data for aggregations
    let customers = await ctx.db.query("customers").collect();
    
    // Filter customers if specific customer selected
    if (customerId && customerId !== "all") {
      customers = customers.filter(c => c.mongoId === customerId);
    }
    
    const validCustomerIds = new Set(customers.map(c => c.mongoId));

    let billingSummaries = await ctx.db
      .query("billingSummaries")
      .withIndex("by_summaryType", (q) => q.eq("summaryType", "client"))
      .collect();

    let payments = await ctx.db.query("payments").collect();
    
    let allOrders = await ctx.db
      .query("orders")
      .withIndex("by_isTrash", (q) => q.eq("isTrash", false))
      .collect();
      
    let savedInvoices = await ctx.db
      .query("savedInvoices")
      .collect();

    // Apply global filters
    if (customerId && customerId !== "all") {
      billingSummaries = billingSummaries.filter(b => b.customerMongoId === customerId);
      payments = payments.filter(p => p.customerMongoId === customerId);
      allOrders = allOrders.filter(o => o.customerMongoId === customerId);
      savedInvoices = savedInvoices.filter(inv => inv.entityMongoId === customerId);
    }
    
    if (dateRange) {
      billingSummaries = billingSummaries.filter(b => b.createdAt >= dateRange.from && b.createdAt <= dateRange.to);
      payments = payments.filter(p => (p.date || p.createdAt) >= dateRange.from && (p.date || p.createdAt) <= dateRange.to);
      allOrders = allOrders.filter(o => {
        const orderDate = o.date || o.createdAt;
        return orderDate >= dateRange.from && orderDate <= dateRange.to;
      });
      savedInvoices = savedInvoices.filter(inv => inv.createdAt >= dateRange.from && inv.createdAt <= dateRange.to);
    }

    // 2. Calculate Top Debtors
    const balanceMap = new Map<string, number>();
    for (const c of customers) {
      const initialBal = (c.initialCharge || 0) - (c.initialPayment || 0);
      balanceMap.set(c.mongoId, initialBal);
    }
    
    for (const b of billingSummaries) {
      if (b.customerMongoId && validCustomerIds.has(b.customerMongoId)) {
        const current = balanceMap.get(b.customerMongoId) || 0;
        balanceMap.set(b.customerMongoId, current + (b.total || 0));
      }
    }
    
    let totalPaymentsReceived = 0;
    
    for (const p of payments) {
      if (p.customerMongoId && p.amount && validCustomerIds.has(p.customerMongoId)) {
        const current = balanceMap.get(p.customerMongoId) || 0;
        balanceMap.set(p.customerMongoId, current - p.amount);
        totalPaymentsReceived += p.amount;
      }
    }
    
    const topDebtors = customers
      .map(c => ({
        ...c,
        balance: balanceMap.get(c.mongoId) || 0
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10); // Top 10 Debtors

    // 3. Pending Orders
    const completedStatuses = ["completed", "delivered", "completedprocess", "billed"];
    const pendingOrders = allOrders
      .filter(o => !completedStatuses.includes((o.status || "").toLowerCase()))
      .sort((a, b) => (b.date || b.createdAt) - (a.date || a.createdAt))
      .slice(0, 15); // Show top 15 pending

    // 4. Unbilled Orders (Ledger Statement area)
    const unbilledOrders = allOrders
      .filter(o => !o.invoiceNumber || o.invoiceNumber.trim() === "")
      .sort((a, b) => (b.date || b.createdAt) - (a.date || a.createdAt));

    // 5. Customer Bills (Saved Invoices for Customers)
    const customerInvoices = savedInvoices
      .filter(inv => inv.entityType === "customer")
      .sort((a, b) => b.createdAt - a.createdAt);
      
    // Group invoices by customer
    const billsByCustomerMap = new Map<string, any>();
    for (const inv of customerInvoices) {
      const cMongoId = inv.entityMongoId;
      if (!validCustomerIds.has(cMongoId)) continue;
      
      if (!billsByCustomerMap.has(cMongoId)) {
        const customerInfo = customers.find(c => c.mongoId === cMongoId);
        billsByCustomerMap.set(cMongoId, {
          customerMongoId: cMongoId,
          companyName: customerInfo?.companyName || inv.companyName || "Unknown Customer",
          invoices: []
        });
      }
      billsByCustomerMap.get(cMongoId).invoices.push(inv);
    }
    
    const customerBills = Array.from(billsByCustomerMap.values())
      .sort((a, b) => a.companyName.localeCompare(b.companyName));

    // 6. Payments Chart Data (Grouped by Month)
    const paymentsByMonth = new Map<string, number>();
    for (const p of payments) {
      if (p.amount) {
        const dateObj = new Date(p.date || p.createdAt);
        const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const current = paymentsByMonth.get(sortKey) || 0;
        paymentsByMonth.set(sortKey, current + p.amount);
      }
    }
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let paymentsChartData = Array.from(paymentsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([sortKey, total]) => ({
        month: monthNames[parseInt(sortKey.split('-')[1]) - 1],
        total: total,
      }));

    // Ensure we have some data so chart doesn't look completely blank if empty
    if (paymentsChartData.length === 0) {
      paymentsChartData = [
        { month: "January", total: 0 },
        { month: "February", total: 0 }
      ];
    }

    return {
      totalPaymentsReceived,
      topDebtors,
      pendingOrders,
      unbilledOrders: {
        count: unbilledOrders.length,
        items: unbilledOrders.slice(0, 10)
      },
      customerBills,
      paymentsChartData
    };
  }
});
