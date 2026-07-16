// @ts-nocheck
import connectDB from "@/lib/db";
import Dyeing from "@/models/Dyeing";
import { NextResponse } from "next/server";
import { mirrorDyeingUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";

// GET all dyeings
export async function GET() {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const dyeings = await Dyeing.find();
    return NextResponse.json(dyeings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE dyeing
export async function POST(req) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const body = await req.json();
    const dyeing = await Dyeing.create(body);
    await mirrorDyeingUpsert(dyeing);
    return NextResponse.json(dyeing, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
