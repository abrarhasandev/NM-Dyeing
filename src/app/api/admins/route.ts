// @ts-nocheck
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAuth";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const users = await User.find({}).select("-password");
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}