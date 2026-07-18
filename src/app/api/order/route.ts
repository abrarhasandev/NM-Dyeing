// @ts-nocheck

import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Batch from "@/models/Batch";
import BillingSummary from "@/models/BillingSummary";
import { NextResponse } from "next/server";
import { mirrorOrderUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

// ─────────────────────────────────────────────────────────────────────────────
//  POST — create a new order (Dual Write)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  try {
    const { error } = await requireAuth();
    if (error) return error;

    await connectDB();
    const body = await req.json();

    const { tableData, date: rawDate, ...rest } = body;

    const updatedTableData = (tableData || []).map((row, index) => ({
      rollNo: index + 1,
      goj: row.goj,
    }));

    // Parse incoming date string
    let parsedDate = null;
    if (rawDate && typeof rawDate === "string") {
      if (rawDate.includes("/")) {
        // Fallback for older formats "DD/MM/YYYY"
        const [d, m, y] = rawDate.split("/").map(Number);
        if (d && m && y) parsedDate = new Date(Date.UTC(y, m - 1, d));
      } else {
        // Standard ISO format "YYYY-MM-DD" sent by frontend
        const parsed = new Date(rawDate);
        if (!isNaN(parsed)) parsedDate = parsed;
      }
    } else if (rawDate instanceof Date) {
      parsedDate = rawDate;
    }

    const order = new Order({
      ...rest,
      date: parsedDate,
      tableData: updatedTableData,
    });

    const savedOrder = await order.save();
    // Soft dual-write to Convex when ORDER_CONVEX_MIRROR=true (never fails the request)
    await mirrorOrderUpsert(savedOrder.toObject ? savedOrder.toObject() : savedOrder);
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
//  GET — fetch orders with pagination + server-side stats (Proxied to Convex)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);

    // ── Pagination ──────────────────────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(100, parseInt(searchParams.get("limit")) || 12);

    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const exactDate = searchParams.get("date") || "";
    const status = searchParams.get("status") || "";
    const clotheTypes = searchParams.get("clotheTypes") || "";
    const finishingType = searchParams.get("finishingType") || "";
    const colour = searchParams.get("colour") || "";
    const sillName = searchParams.get("sillName") || "";
    const quality = searchParams.get("quality") || "";
    const transporterName = searchParams.get("transporterName") || "";
    const isTrash = searchParams.get("isTrash") === "true";

    // Call Convex securely from the Next.js server
    const payload = await fetchQuery(api.orderQueries.listOrdersWithStats, {
      page,
      limit,
      search,
      startDate,
      endDate,
      exactDate,
      status,
      clotheTypes,
      finishingType,
      colour,
      sillName,
      quality,
      transporterName,
      isTrash,
    });

    return NextResponse.json(payload, {
      headers: {
        // Private to the browser; fresh for 15s; serve stale for up to 60s
        // while revalidating in the background — no stale data risk for order lists
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching orders from Convex:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
