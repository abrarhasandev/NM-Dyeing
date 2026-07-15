import connectDB from "@/lib/db";
import Calender from "@/models/Calender";
import { NextResponse } from "next/server";
import { mirrorCalenderUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";

// ✅ GET all calenders
export async function GET() {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const calenders = await Calender.find().sort({ createdAt: -1 });
    return NextResponse.json(calenders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ CREATE calender
export async function POST(req) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const body = await req.json();
    const calender = await Calender.create(body);
    await mirrorCalenderUpsert(calender);
    return NextResponse.json(calender, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
