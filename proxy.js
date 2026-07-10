import NextAuth from "next-auth";
import { authConfig } from "./src/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const proxyHandler = auth(function proxy(req) {
  const { pathname } = req.nextUrl;
  console.log("Proxy middleware executed for:", pathname);

  // Allow Auth.js endpoints to proceed without checks
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isLoggedIn = Boolean(req.auth?.user);
  const isAdmin = req.auth?.user?.role === "admin";
  const isAdminRoute = pathname.startsWith("/dashboard");

  // --- API route protection ---
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

// Support both Next.js 16 proxy conventions (default export and named export)
export { proxyHandler as proxy };
export default proxyHandler;

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*", "/login"],
};
