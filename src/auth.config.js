/**
 * Edge / proxy-compatible auth configuration.
 * No Node-only imports (bcrypt, mongoose, etc.).
 * Used by proxy.js; full authorize logic lives in auth.js.
 */

// ── Startup guard — fail loud if AUTH_SECRET is missing or weak ──────────────
const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  throw new Error(
    "AUTH_SECRET must be set and at least 32 characters long. " +
      "Generate one with: openssl rand -hex 64"
  );
}

export const authConfig = {
  trustHost: true,

  providers: [],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthenticated = !!auth?.user;

      if (pathname.startsWith("/api/auth")) return true;

      if (pathname.startsWith("/api/")) {
        return isAuthenticated;
      }

      if (pathname === "/login") {
        if (isAuthenticated) {
          return Response.redirect(new URL("/dashboard/order", request.nextUrl));
        }
        return true;
      }

      return isAuthenticated;
    },

    async jwt({ token, user, trigger }) {
      // Initial sign-in — populate token with user data
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.iat = Math.floor(Date.now() / 1000);
      }

      // On session refresh (updateAge interval), mark for potential revalidation
      if (trigger === "update") {
        token.iat = Math.floor(Date.now() / 1000);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        /* ignore invalid url */
      }
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60,     // 4 hours (reduced from 8h)
    updateAge: 15 * 60,       // Refresh JWT every 15 minutes
  },

  secret: authSecret,
};
