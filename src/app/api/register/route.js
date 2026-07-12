import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import User from "@/models/User";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/requireAuth";
import { mirrorUserUpsert } from "@/lib/orders/convexServer";

const registerLimiter = rateLimit({ intervalMs: 60 * 60 * 1000, limit: 5 });
const VALID_ROLES = ["admin", "user", "moderator"];

function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
    return "Password must contain at least one letter and one number";
  }
  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const ip = getClientIp(request);
    const { success } = registerLimiter.check(`register:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const assignedRole = VALID_ROLES.includes(role) ? role : "user";

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    // Structural mirror only (password never sent to Convex)
    await mirrorUserUpsert(newUser);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
