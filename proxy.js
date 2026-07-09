import NextAuth from "next-auth";
import { authConfig } from "./src/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(function proxy(req) {
  const { pathname } = req.nextUrl;

  const isLoggedIn = Boolean(req.auth?.user);
  const isAdmin = req.auth?.user?.role === "admin";
  const isAdminRoute = pathname.startsWith("/dashboard");

  // --- API route protection ---
  // All /api/* routes (except /api/auth/*, which Auth.js needs public) require
  // a valid session token. Sensitive admin routes additionally require role==="admin".
  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminOnlyApiRoutes = ["/api/admins", "/api/register"];
    if (adminOnlyApiRoutes.some((r) => pathname.startsWith(r)) && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // --- Page route protection ---
  const publicRoutes = ["/login"];

  if (!isLoggedIn && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

