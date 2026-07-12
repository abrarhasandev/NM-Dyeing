/**
 * Edge / proxy-compatible auth configuration.
 * No Node-only imports (bcrypt, mongoose, etc.).
 * Used by proxy.js; full authorize logic lives in auth.js.
 */
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

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
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
    maxAge: 8 * 60 * 60, // 8 hours
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};
