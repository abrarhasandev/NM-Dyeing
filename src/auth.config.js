import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

/**
 * Edge-compatible auth configuration.
 * Does NOT include any Node.js-only imports (bcrypt, mongoose, etc.).
 * Used by proxy.js (middleware) and as the base for the full auth.js config.
 */
export const authConfig = {
  providers: [
    // Providers listed here without the `authorize` callback — that lives in auth.js
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "enter email" },
        password: { label: "Password", type: "password" },
      },
      // authorize intentionally omitted here; defined in the full auth.js
      authorize: () => null,
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
