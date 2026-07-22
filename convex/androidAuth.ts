import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a random 64-char hex string for session tokens
function generateToken() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const login = mutation({
  args: {
    loginId: v.string(),
    password: v.string(), // App should hash the password or send it securely over HTTPS.
    deviceInfo: v.optional(v.string()),
    fcmToken: v.optional(v.string()), // Optionally register FCM token on login
  },
  handler: async (ctx, args) => {
    // 1. Find the employee by loginId
    const employee = await ctx.db
      .query("transportEmployees")
      .withIndex("by_loginId", (q) => q.eq("loginId", args.loginId))
      .first();

    if (!employee) {
      throw new Error("Invalid credentials");
    }

    // 2. Verify password (simple exact match for now, assuming admin sets it directly or hashes it)
    if (employee.password !== args.password) {
      throw new Error("Invalid credentials");
    }

    // 3. Create a session token
    const token = generateToken();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days expiry

    await ctx.db.insert("transportEmployeeSessions", {
      employeeId: employee._id,
      token,
      deviceInfo: args.deviceInfo,
      createdAt: Date.now(),
      expiresAt,
    });

    // 4. Update FCM token if provided
    if (args.fcmToken) {
      await ctx.db.patch(employee._id, { fcmToken: args.fcmToken });
    }

    // Return the token and basic employee info for the app to store
    return {
      token,
      employeeId: employee._id,
      name: employee.name,
      vehicleType: employee.vehicleType,
    };
  },
});

export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("transportEmployeeSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      // Clean up the session
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("transportEmployeeSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      return null; // Session expired
    }

    return { employeeId: session.employeeId };
  },
});
