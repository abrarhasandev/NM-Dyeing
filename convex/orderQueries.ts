import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

export const listOrdersWithStats = query({
  args: {
    page: v.number(),
    limit: v.number(),
    search: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    exactDate: v.optional(v.string()),
    status: v.optional(v.string()),
    clotheTypes: v.optional(v.string()),
    finishingType: v.optional(v.string()),
    colour: v.optional(v.string()),
    sillName: v.optional(v.string()),
    quality: v.optional(v.string()),
    transporterName: v.optional(v.string()),
    isTrash: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isTrash = args.isTrash ?? false;
    let ordersQuery = ctx.db.query("orders").withIndex("by_isTrash", (q) => q.eq("isTrash", isTrash));

    const allOrders = await ordersQuery.collect();

    // 1. Parsing Filters
    const searchRaw = (args.search || "").trim().toLowerCase();
    
    let queryStart = 0;
    let queryEnd = Infinity;

    if (args.exactDate) {
      const parts = args.exactDate.split("/");
      if (parts.length === 3) {
        const d = Number(parts[0]);
        const m = Number(parts[1]);
        const y = Number(parts[2]);
        if (d && m && y) {
          queryStart = Date.UTC(y, m - 1, d);
          queryEnd = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
        }
      }
    } else if (args.startDate && args.endDate) {
      const parsedStart = new Date(args.startDate).getTime();
      const parsedEndObj = new Date(args.endDate);
      parsedEndObj.setUTCHours(23, 59, 59, 999);
      const parsedEnd = parsedEndObj.getTime();
      if (!isNaN(parsedStart) && !isNaN(parsedEnd)) {
        queryStart = parsedStart;
        queryEnd = parsedEnd;
      }
    }

    let prevStart = 0;
    let prevEnd = 0;
    if (queryStart > 0 && queryEnd < Infinity && !args.exactDate) {
      const duration = queryEnd - queryStart;
      prevStart = queryStart - duration;
      prevEnd = queryStart - 1;
    }

    const parseMulti = (str?: string) => {
      if (!str) return [];
      return str.split(",").map(s => s.trim()).filter(Boolean);
    };

    const clotheTypesArr = parseMulti(args.clotheTypes);
    const finishingTypeArr = parseMulti(args.finishingType);
    const colourArr = parseMulti(args.colour);
    const sillNameArr = parseMulti(args.sillName);
    const qualityArr = parseMulti(args.quality);

    // 2. Filter Orders and Compute Stats in a single pass
    const filteredOrders = [];
    
    let kpiTotalOrders = 0;
    let kpiTotalGoj = 0;
    const uniqueCustomers = new Set<string>();
    let activeCount = 0;
    let activeGoj = 0;
    
    let prevKpiTotalOrders = 0;
    let prevKpiTotalGoj = 0;

    // Chart buckets: key -> { _id: { year, month, day, clothCat }, count, totalGoj }
    const chartBuckets = new Map<string, any>();

    for (const order of allOrders) {
      // Basic text search
      if (searchRaw) {
        const oId = (order.orderId || "").toLowerCase();
        const cName = (order.companyName || "").toLowerCase();
        if (!oId.includes(searchRaw) && !cName.includes(searchRaw)) continue;
      }

      // Exact match filters
      if (args.status && order.status !== args.status) continue;
      if (args.transporterName && order.transporterName !== args.transporterName) continue;

      // Multi-select filters
      if (clotheTypesArr.length > 0 && !clotheTypesArr.includes(order.clotheType || "")) continue;
      if (finishingTypeArr.length > 0 && !finishingTypeArr.includes(order.finishingType || "")) continue;
      if (colourArr.length > 0 && !colourArr.includes(order.colour || "")) continue;
      if (sillNameArr.length > 0 && !sillNameArr.includes(order.sillName || "")) continue;
      if (qualityArr.length > 0 && !qualityArr.includes(order.quality || "")) continue;

      const rowDate = order.date || order.createdAt;
      
      // Calculate totalGoj for this order (use totalGoj if set, else sum from tableData)
      let oGoj = 0;
      if (order.totalGoj != null) {
        oGoj = order.totalGoj;
      } else if (order.tableData) {
        oGoj = order.tableData.reduce((sum, row) => sum + (Number(row.goj) || 0), 0);
      }

      // Check if inside previous date range for prevKpi
      if (prevStart > 0 && prevEnd > 0 && rowDate >= prevStart && rowDate <= prevEnd) {
        prevKpiTotalOrders++;
        prevKpiTotalGoj += oGoj;
      }

      // Check if inside current date range for main results
      if (queryStart > 0 && queryEnd < Infinity) {
        if (rowDate < queryStart || rowDate > queryEnd) continue;
      }

      // It passed all filters, add to list
      filteredOrders.push(order);

      // Add to KPIs
      kpiTotalOrders++;
      kpiTotalGoj += oGoj;
      if (order.companyName) uniqueCustomers.add(order.companyName);

      const isActive = !["completed", "delivered", "completedprocess"].includes(order.status || "");
      if (isActive) {
        activeCount++;
        activeGoj += oGoj;
      }

      // Add to chart buckets
      const d = new Date(rowDate);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      
      let clothCat = "other";
      const cType = (order.clotheType || "").toLowerCase();
      if (cType.includes("cotton")) clothCat = "cotton";
      else if (cType.includes("silk") || cType.includes("sill")) clothCat = "silk";

      const bucketKey = `${year}-${month}-${day}-${clothCat}`;
      if (chartBuckets.has(bucketKey)) {
        const b = chartBuckets.get(bucketKey);
        b.count++;
        b.totalGoj += oGoj;
      } else {
        chartBuckets.set(bucketKey, {
          _id: { year, month, day, clothCat },
          count: 1,
          totalGoj: oGoj
        });
      }
    }

    // Sort descending by date, then createdAt
    filteredOrders.sort((a, b) => {
      const aDate = a.date || a.createdAt;
      const bDate = b.date || b.createdAt;
      if (aDate !== bDate) return bDate - aDate;
      return b.createdAt - a.createdAt;
    });

    const totalCount = filteredOrders.length;
    
    // Pagination
    const skip = (args.page - 1) * args.limit;
    const paginatedOrders = filteredOrders.slice(skip, skip + args.limit);

    // 3. Enrich paginated orders with batch summaries and billing summaries
    const enrichedOrders = [];
    for (const order of paginatedOrders) {
      const batchesData = await ctx.db
        .query("batches")
        .withIndex("by_orderMongoId", (q) => q.eq("orderMongoId", order.mongoId))
        .collect();

      const billingSummariesData = await ctx.db
        .query("billingSummaries")
        .withIndex("by_orderMongoId", (q) => q.eq("orderMongoId", order.mongoId))
        .filter((q) => q.eq(q.field("summaryType"), "client"))
        .collect();

      let batchCount = 0;
      let totalBatchBundle = 0;
      let totalBatchGoj = 0;
      let dispatchCount = 0;
      let dispatchTotalBundle = 0;
      let dispatchTotalGoj = 0;
      let dispatchOriginalGoj = 0;

      for (const bDoc of batchesData) {
        if (bDoc.batches) {
          batchCount += bDoc.batches.length;
          for (const b of bDoc.batches) {
            if (b.rows) {
              totalBatchBundle += b.rows.length;
              totalBatchGoj += b.rows.reduce((sum, row) => sum + (Number(row.goj) || 0), 0);
            }
            if (["billing", "completed"].includes(b.status)) {
              dispatchCount++;
              if (b.rows) {
                dispatchTotalBundle += b.rows.length;
                dispatchTotalGoj += b.rows.reduce((sum, row) => {
                  const sumIdx = Array.isArray(row.idx)
                    ? row.idx.reduce((s, x) => s + (Number(x) || 0), 0)
                    : (Number(row.idx) || 0);
                  const sumExtras = Array.isArray(row.extraInputs)
                    ? row.extraInputs.reduce((s, x) => s + (Number(x) || 0), 0)
                    : (Number(row.extraInputs) || 0);
                  return sum + sumIdx + sumExtras;
                }, 0);
                dispatchOriginalGoj += b.rows.reduce((sum, row) => sum + (Number(row.goj) || 0), 0);
              }
            }
          }
        }
      }

      enrichedOrders.push({
        ...order,
        _id: order.mongoId, // To keep UI compatibility where it expects _id to be mongoId (like useOrders doing router.push(?id=...))
        convexId: order._id,
        batchSummary: {
          batchCount,
          totalBatchBundle,
          totalBatchGoj,
          dispatchCount,
          dispatchTotalBundle,
          dispatchTotalGoj,
          dispatchOriginalGoj,
          invoiceCount: billingSummariesData.length,
        }
      });
    }

    return {
      orders: enrichedOrders,
      totalCount,
      kpiData: {
        totalOrders: kpiTotalOrders,
        totalGoj: kpiTotalGoj,
        uniqueCustomers: uniqueCustomers.size,
        activeCount,
        activeGoj,
      },
      prevKpiData: {
        totalOrders: prevKpiTotalOrders,
        totalGoj: prevKpiTotalGoj,
      },
      chartData: Array.from(chartBuckets.values()),
    };
  }
});

export const getOrderById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // ID could be MongoID or Convex ID or orderId (string)
    // First try by mongoId
    let order = await ctx.db
      .query("orders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.id))
      .unique();

    if (!order) {
      // Try by orderId (string)
      order = await ctx.db
        .query("orders")
        .withIndex("by_orderId", (q) => q.eq("orderId", args.id))
        .unique();
    }
    
    if (order) {
      return {
        ...order,
        _id: order.mongoId,
        convexId: order._id,
      };
    }

    return null;
  }
});
