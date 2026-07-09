import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Batch from "@/models/Batch";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a filter object from request search params.
 * After the migration, `date` is a proper BSON Date, so range queries use
 * native $gte / $lte on an indexed field — no $expr / $dateFromString needed.
 */
function buildQuery(searchParams) {
  const searchRaw    = searchParams.get("search")?.trim() || "";
  const startDate    = searchParams.get("startDate") || "";
  const endDate      = searchParams.get("endDate") || "";
  const exactDate    = searchParams.get("date") || "";
  const status       = searchParams.get("status") || "";
  const clotheTypes  = searchParams.get("clotheTypes") || "";
  const finishingType = searchParams.get("finishingType") || "";
  const colour       = searchParams.get("colour") || "";
  const sillName     = searchParams.get("sillName") || "";
  const quality      = searchParams.get("quality") || "";

  const query = {};

  // ── Text search — use $text index if available, fall back to $regex ────────
  if (searchRaw) {
    // $text is fastest when the text index exists
    query.$text = { $search: searchRaw };
  }

  // ── Date range — direct Date comparison on indexed field ───────────────────
  if (exactDate) {
    // Exact single day: match midnight-to-midnight UTC
    const [d, m, y] = exactDate.split("/").map(Number);
    if (d && m && y) {
      const dayStart = new Date(Date.UTC(y, m - 1, d));
      const dayEnd   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      query.date = { $gte: dayStart, $lte: dayEnd };
    }
  } else if (startDate && endDate) {
    const parsedStart = new Date(startDate);
    const parsedEnd   = new Date(endDate);
    parsedEnd.setHours(23, 59, 59, 999);
    if (!isNaN(parsedStart) && !isNaN(parsedEnd)) {
      query.date = { $gte: parsedStart, $lte: parsedEnd };
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────────
  if (status) query.status = status;

  // ── Multi-select filters ───────────────────────────────────────────────────
  const addMultiFilter = (key, raw) => {
    if (!raw) return;
    const values = raw.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length > 0) query[key] = { $in: values };
  };

  addMultiFilter("clotheType",    clotheTypes);
  addMultiFilter("finishingType", finishingType);
  addMultiFilter("colour",        colour);
  addMultiFilter("sillName",      sillName);
  addMultiFilter("quality",       quality);

  return query;
}

/**
 * Build the previous-period date bounds (mirror of current range).
 */
function buildPrevDateRange(startDate, endDate) {
  const parsedStart = new Date(startDate);
  const parsedEnd   = new Date(endDate);
  parsedEnd.setHours(23, 59, 59, 999);
  const duration = parsedEnd.getTime() - parsedStart.getTime();
  return {
    prevStart: new Date(parsedStart.getTime() - duration),
    prevEnd:   new Date(parsedStart.getTime() - 1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SERVER-SIDE AGGREGATION  (Priority 2)
//  Returns lightweight chart buckets + KPI numbers — NOT raw documents.
// ─────────────────────────────────────────────────────────────────────────────

async function runStatsAggregation(matchQuery) {
  /**
   * Single pipeline that computes in one DB round-trip:
   *  - totalOrders (count)
   *  - totalGoj (sum)
   *  - uniqueCustomers (distinct companyName count)
   *  - activeCount + activeGoj (status ≠ completed/delivered)
   *  - chart buckets grouped by { year, month } × clotheType category
   */
  const pipeline = [
    { $match: matchQuery },
    {
      $facet: {
        // ── KPI numbers ──────────────────────────────────────────────────────
        kpi: [
          {
            $group: {
              _id: null,
              totalOrders:      { $sum: 1 },
              totalGoj:         { $sum: { $ifNull: ["$totalGoj", 0] } },
              uniqueCustomers:  { $addToSet: "$companyName" },
            },
          },
          {
            $project: {
              _id:             0,
              totalOrders:     1,
              totalGoj:        1,
              uniqueCustomers: { $size: "$uniqueCustomers" },
            },
          },
        ],

        // ── Active orders (in-progress) ──────────────────────────────────────
        active: [
          {
            $match: {
              status: {
                $nin: ["completed", "delivered", "completedprocess"],
              },
            },
          },
          {
            $group: {
              _id:       null,
              count:     { $sum: 1 },
              totalGoj:  { $sum: { $ifNull: ["$totalGoj", 0] } },
            },
          },
        ],

        // ── Chart data: group by calendar period × cloth category ────────────
        chart: [
          {
            $group: {
              _id: {
                year:  { $year:  "$date" },
                month: { $month: "$date" },
                day:   { $dayOfMonth: "$date" },
                clothCat: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $regexMatch: {
                            input: { $toLower: { $ifNull: ["$clotheType", ""] } },
                            regex: "cotton",
                          },
                        },
                        then: "cotton",
                      },
                      {
                        case: {
                          $regexMatch: {
                            input: { $toLower: { $ifNull: ["$clotheType", ""] } },
                            regex: "silk|sill",
                          },
                        },
                        then: "silk",
                      },
                    ],
                    default: "other",
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        ],
      },
    },
  ];

  const [result] = await Order.aggregate(pipeline);

  const kpi = result?.kpi?.[0] ?? {
    totalOrders: 0,
    totalGoj: 0,
    uniqueCustomers: 0,
  };
  const active = result?.active?.[0] ?? { count: 0, totalGoj: 0 };
  const chartRaw = result?.chart ?? [];

  return { kpi, active, chartRaw };
}

/**
 * Previous-period KPI aggregation (growth rate calculation).
 * Only counts + goj — no chart needed for prev period.
 */
async function runPrevKpiAggregation(baseQuery, prevStart, prevEnd) {
  const prevQuery = { ...baseQuery, date: { $gte: prevStart, $lte: prevEnd } };

  const [result] = await Order.aggregate([
    { $match: prevQuery },
    {
      $group: {
        _id:      null,
        totalOrders: { $sum: 1 },
        totalGoj:    { $sum: { $ifNull: ["$totalGoj", 0] } },
      },
    },
  ]);

  return result ?? { totalOrders: 0, totalGoj: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST — create a new order
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { tableData, date: rawDate, ...rest } = body;

    const updatedTableData = (tableData || []).map((row, index) => ({
      rollNo: index + 1,
      goj: row.goj,
    }));

    // Parse incoming date string "DD/MM/YYYY" → Date for new orders
    let parsedDate = null;
    if (rawDate && typeof rawDate === "string") {
      const [d, m, y] = rawDate.split("/").map(Number);
      if (d && m && y) parsedDate = new Date(Date.UTC(y, m - 1, d));
    } else if (rawDate instanceof Date) {
      parsedDate = rawDate;
    }

    const order = new Order({
      ...rest,
      date: parsedDate,
      tableData: updatedTableData,
    });

    const savedOrder = await order.save();
    return NextResponse.json(savedOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET — fetch orders with pagination + server-side stats
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // ── Pagination ──────────────────────────────────────────────────────────
    const page  = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(100, parseInt(searchParams.get("limit")) || 12);
    const skip  = (page - 1) * limit;

    const startDate = searchParams.get("startDate") || "";
    const endDate   = searchParams.get("endDate") || "";

    // ── Build query ─────────────────────────────────────────────────────────
    const query = buildQuery(searchParams);

    // ── Priority 4: Parallelise count + paginated find + stats agg ──────────
    // All three run concurrently — single wait instead of three sequential ones
    const [totalCount, orders, { kpi, active, chartRaw }] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      runStatsAggregation(query),
    ]);

    // ── Previous-period KPI (only when a date range is active) ──────────────
    let prevKpi = { totalOrders: 0, totalGoj: 0 };
    if (startDate && endDate) {
      const { prevStart, prevEnd } = buildPrevDateRange(startDate, endDate);
      // Build a base query without the date range for prev period
      const baseQueryNoDates = { ...query };
      delete baseQueryNoDates.date;
      prevKpi = await runPrevKpiAggregation(baseQueryNoDates, prevStart, prevEnd);
    }

    const orderIds = orders.map((o) => o._id);
    const batchesData = await Batch.find({ orderId: { $in: orderIds } }).lean();

    const enrichedOrders = orders.map((order) => {
      const batchDoc = batchesData.find((b) => String(b.orderId) === String(order._id));
      let totalBatchBundle = 0;
      let totalBatchGoj = 0;
      let batchCount = 0;

      if (batchDoc && batchDoc.batches) {
        batchCount = batchDoc.batches.length;
        batchDoc.batches.forEach((b) => {
          if (b.rows) {
            totalBatchBundle += b.rows.length;
            totalBatchGoj += b.rows.reduce((sum, row) => sum + (Number(row.goj) || 0), 0);
          }
        });
      }

      return {
        ...order,
        batchSummary: {
          batchCount,
          totalBatchBundle,
          totalBatchGoj,
        },
      };
    });

    // ── Response payload ─────────────────────────────────────────────────────
    //  No more allFilteredOrders (raw docs)!
    //  Client receives lightweight computed data only.
    const payload = {
      orders: enrichedOrders,
      totalCount,
      // KPIs (replaces allFilteredOrders computation on the client)
      kpiData: {
        totalOrders:      kpi.totalOrders,
        totalGoj:         kpi.totalGoj,
        uniqueCustomers:  kpi.uniqueCustomers,
        activeCount:      active.count,
        activeGoj:        active.totalGoj,
      },
      prevKpiData: {
        totalOrders: prevKpi.totalOrders,
        totalGoj:    prevKpi.totalGoj,
      },
      // Lightweight chart buckets (date + category + count only)
      chartData: chartRaw,
    };

    return NextResponse.json(payload, {
      headers: {
        // Private to the browser; fresh for 15s; serve stale for up to 60s
        // while revalidating in the background — no stale data risk for order lists
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
