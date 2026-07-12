"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "@/components/Sidebar/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import React from "react";
import { ModeToggle } from "@/components/ModeToggle";

const PUBLIC_PATHS = ["/login"];

function DashboardHeader() {
  const pathname = usePathname();
  const segments = pathname ? pathname.split("/").filter(Boolean) : [];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-4 border-b border-sidebar-border bg-background transition-all duration-200 ease-in-out sticky top-0 z-50 shadow-sm">
      <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      <div className="h-4 w-[1px] bg-sidebar-border/30 mx-1" />

      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        {segments.length === 0 && (
          <span className="text-foreground font-semibold">Dashboard</span>
        )}
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = "/" + segments.slice(0, index + 1).join("/");
          const title =
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/([A-Z])/g, " $1");

          return (
            <React.Fragment key={href}>
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className="text-muted-foreground/70"
                />
              )}
              {isLast ? (
                <span className="text-foreground font-semibold">{title}</span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-foreground transition-colors"
                >
                  {title}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="ml-auto">
        <ModeToggle />
      </div>
    </header>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-[#f54e00] animate-spin" />
        <p className="text-sm font-medium">Checking session…</p>
      </div>
    </div>
  );
}

export default function SessionWrapper({ children, defaultOpen = true }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      const callback = encodeURIComponent(pathname);
      router.replace(`/login?callbackUrl=${callback}`);
    }
  }, [status, router, pathname, isPublic]);

  // Never paint protected UI until session is known
  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  const role = session?.user?.role;
  const isAdmin = role === "admin";

  // Public routes (login): no app chrome
  if (isPublic) {
    // Only send admins into the app — avoids login ↔ dashboard loops
    if (status === "authenticated" && session?.user?.email && isAdmin) {
      router.replace("/dashboard/order");
      return <AuthLoadingScreen />;
    }
    return <>{children}</>;
  }

  // Protected: never render page content without a valid admin session
  if (status === "unauthenticated" || !session?.user?.email) {
    return <AuthLoadingScreen />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            Your account does not have permission to use this application.
          </p>
          <button
            type="button"
            className="text-sm font-medium text-[#f54e00] hover:underline"
            onClick={() => {
              import("next-auth/react").then(({ signOut }) =>
                signOut({ callbackUrl: "/login" })
              );
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="bg-background flex flex-col flex-1 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
