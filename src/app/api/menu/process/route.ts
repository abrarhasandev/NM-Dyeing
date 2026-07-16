// @ts-nocheck
import connectDB from "@/lib/db";
import Process from "@/models/menu/Process";
import { mirrorProcessUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";

export async function GET() {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const processes = await Process.find().sort({ createdAt: -1 });
    return new Response(JSON.stringify(processes), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const body = await req.json();
    const { name, price } = body;

    if (!name || price === undefined) {
      return new Response(
        JSON.stringify({ error: "Name and price are required" }),
        { status: 400 }
      );
    }

    const newProcess = await Process.create({ name, price });
    await mirrorProcessUpsert(newProcess);
    return new Response(JSON.stringify(newProcess), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create" }), {
      status: 500,
    });
  }
}
