// @ts-nocheck
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

console.log("🛠️ [ConvexClientProvider] Initializing with URL:", convexUrl || "UNDEFINED - FALLING BACK TO PLACEHOLDER");

const convex = new ConvexReactClient(convexUrl ?? "https://placeholder.convex.cloud");

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!convexUrl) {
      const msg = "[Convex] NEXT_PUBLIC_CONVEX_URL is not set. Transport and other Convex features will hang indefinitely. Please restart your Next.js dev server if you just added it to .env.local";
      console.error(msg);
      setError(new Error(msg));
    }
  }, []);

  if (error) {
    throw error; // Let Next.js error boundary catch it loudly
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
