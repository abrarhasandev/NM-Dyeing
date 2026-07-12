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

export async function GET() {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
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

    const payload = {
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

    return NextResponse.json(payload, {
      headers: {
        // Browser: 2 min fresh | serve stale 10 min while revalidating
        "Cache-Control": "private, max-age=120, stale-while-revalidate=600",
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
