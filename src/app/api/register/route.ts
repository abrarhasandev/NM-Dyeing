// @ts-nocheck
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

import User from "@/models/User";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/requireAuth";
import { mirrorUserUpsert } from "@/lib/orders/convexServer";

const registerLimiter = rateLimit({ intervalMs: 60 * 60 * 1000, limit: 5 });
const VALID_ROLES = ["admin", "user", "moderator"];

/**
 * Strong password policy:
 *  - 8–128 characters
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 *  - At least one special character
 *
 * Max 128 chars prevents bcrypt DoS (bcrypt truncates at 72 bytes anyway,
 * but extremely long inputs still consume CPU in pre-hash processing).
 */
function validatePassword(pw) {
  if (typeof pw !== "string") {
    return "Password is required";
  }
  if (pw.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (pw.length > 128) {
    return "Password must not exceed 128 characters";
  }
  if (!/[A-Z]/.test(pw)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(pw)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/\d/.test(pw)) {
    return "Password must contain at least one digit";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) {
    return "Password must contain at least one special character";
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

    const { name, email: rawEmail, password, role } = await request.json();
    const email = rawEmail ? String(rawEmail).trim().toLowerCase() : undefined;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Sanitize name — strip HTML/script tags
    const sanitizedName = String(name).trim().replace(/<[^>]*>/g, "");
    if (!sanitizedName || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: "Name must be 1-100 characters" },
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
      // Generic message — don't confirm whether an email is registered
      return NextResponse.json(
        { error: "Registration failed. Please try a different email." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const assignedRole = VALID_ROLES.includes(role) ? role : "user";

    const newUser = await User.create({
      name: sanitizedName,
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
