// @ts-nocheck
import { cache } from "react";
import { auth as uncachedAuth } from "@/auth";
import { redirect } from "next/navigation";

// Memoized auth for Server Components and Actions
export const auth = cache(uncachedAuth);

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as any).role !== "admin") {
    redirect("/dashboard"); // or some unauthorized page
  }
  return session;
}
