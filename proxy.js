import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Keep in sync with security-headers.mjs + vercel.json (Convex needs wss://)
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://merakiui.com https://api.dicebear.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site wss://*.convex.site",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const CSP_VERSION = "wss-v2";

function withSecurityHeaders(response) {
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("X-NM-CSP", CSP_VERSION);
  return response;
}

const { auth } = NextAuth(authConfig);

export default auth(() => {
  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/api/:path*"],
};
