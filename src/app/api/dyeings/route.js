import connectDB from "@/lib/db";
import Dyeing from "@/models/Dyeing";
import { NextResponse } from "next/server";
import { mirrorDyeingUpsert } from "@/lib/orders/convexServer";

// GET all dyeings
export async function GET() {
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
