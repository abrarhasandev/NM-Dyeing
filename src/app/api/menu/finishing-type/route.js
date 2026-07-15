import connectDB from "@/lib/db";
import FinishingType from "@/models/menu/FinishingType";
import { mirrorFinishingTypeUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";

export async function POST(req) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
      });
    }

    const newType = await FinishingType.create({ name });
    await mirrorFinishingTypeUpsert(newType);

    return new Response(JSON.stringify(newType), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Server Error" }), {
      status: 500,
    });
  }
}



export async function GET() {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

    try {
      await connectDB();
      const types = await FinishingType.find().sort({ createdAt: -1 });
      return new Response(JSON.stringify(types), { status: 200 });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: "Server Error" }), {
        status: 500,
      });
    }
  }