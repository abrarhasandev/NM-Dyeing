/**
 * GET /api/menu/all
 *
 * Single endpoint that returns ALL lookup/menu data in one request.
 * Replaces 9 individual calls from useAppData.js → 1 call.
 *
 * All 9 collections are fetched in parallel (Promise.all).
 * Response includes HTTP caching headers since this data changes rarely.
 *
 * Cache strategy:
 *  - s-maxage=300  → CDN/Edge cache for 5 minutes
 *  - max-age=120   → Browser cache for 2 minutes
 *  - stale-while-revalidate=600 → Serve stale while refreshing for 10 minutes
 */

import connectDB from "@/lib/db";
import ClothType     from "@/models/menu/ClothType";
import FinishingType from "@/models/menu/FinishingType";
import Colour        from "@/models/menu/Colour";
import SillName      from "@/models/menu/SillName";
import Quality       from "@/models/menu/Quality";
import Process       from "@/models/menu/Process";
import Customer      from "@/models/customers";
import Calender      from "@/models/Calender";
import Dyeing        from "@/models/Dyeing";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
export const dynamic = "force-dynamic"; // Disable Next.js static cache; we manage our own

// In-memory cache to prevent multiple parallel database hits on page refreshes
let menuCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 15000; // 15 seconds

export async function GET() {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    const now = Date.now();
    if (menuCache && now - lastFetchTime < CACHE_TTL) {
      return NextResponse.json(menuCache, {
        headers: {
          "Cache-Control": "private, max-age=120, stale-while-revalidate=600",
          "X-Cache": "HIT",
        },
      });
    }

    await connectDB();

    // All 9 queries fire simultaneously — single wait
    const [
      clotheTypes,
      finishingTypes,
      colours,
      sillNames,
      qualities,
      processes,
      customers,
      calender,
      dyeings,
    ] = await Promise.all([
      ClothType.find().sort({ createdAt: -1 }).lean(),
      FinishingType.find().sort({ createdAt: -1 }).lean(),
      Colour.find().sort({ createdAt: -1 }).lean(),
      SillName.find().sort({ createdAt: -1 }).lean(),
      Quality.find().sort({ createdAt: -1 }).lean(),
      Process.find().sort({ createdAt: -1 }).lean(),
      Customer.find().sort({ createdAt: -1 }).lean(),
      Calender.find().sort({ createdAt: -1 }).lean(),
      Dyeing.find().lean(),
    ]);

    menuCache = {
      clotheTypes,
      finishingTypes,
      colours,
      sillNames,
      qualities,
      processes,
      customers,
      calender,
      dyeings,
    };
    lastFetchTime = now;

    return NextResponse.json(menuCache, {
      headers: {
        // Browser: 2 min fresh | serve stale 10 min while revalidating
        "Cache-Control": "private, max-age=120, stale-while-revalidate=600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("GET /api/menu/all error:", error);
    return NextResponse.json(
      { error: "Failed to load menu data" },
      { status: 500 }
    );
  }
}
