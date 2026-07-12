import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { authConfig } from "@/auth.config";

const loginLimiter = rateLimit({ intervalMs: 15 * 60 * 1000, limit: 10 });

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip = getClientIp(request);
        const { success } = loginLimiter.check(`login:${ip}`);
        if (!success) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password;

        if (!email || !password || typeof password !== "string") {
          return null;
        }

        // Basic shape check — reject obvious garbage early
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email }).select(
          "+password name email role"
        );

        // Valid dummy hash so bcrypt.compare never throws on missing users
        const DUMMY_HASH =
          "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

        if (!user?.password) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Only allow known app roles into a session
        const role = user.role || "user";
        if (!["admin", "user", "moderator"].includes(role)) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    /**
     * Block OAuth / empty credential sessions that never passed authorize.
     * Credentials provider already returns null on failure; this is a hard gate.
     */
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return Boolean(user?.id && user?.email && user?.role);
      }
      // Google / other providers are disabled unless explicitly re-enabled later
      return false;
    },
  },
});
