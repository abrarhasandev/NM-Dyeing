"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/Sidebar/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import Loading from "@/app/loading";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import React from "react";
import { ModeToggle } from "@/components/ModeToggle";

function DashboardHeader() {
  const pathname = usePathname();
  const segments = pathname ? pathname.split('/').filter(Boolean) : [];

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
          const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/([A-Z])/g, ' $1');

          return (
            <React.Fragment key={href}>
              {index > 0 && <ChevronRight size={14} className="text-muted-foreground/70" />}
              {isLast ? (
                <span className="text-foreground font-semibold">{title}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors">
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

export default function SessionWrapper({ children, defaultOpen = true }) {
  // const { data: session, status } = useSession();
  const session = { user: { name: "Test Admin", email: "admin@nmdyeing.com", image: null } };
  const status = "authenticated";
  const router = useRouter();
  const [showLoader, setShowLoader] = useState(false);

  // ✅ Always show loader for 1 second on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // ✅ Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ✅ Show loader if session is loading OR timer active
  if (status === "loading" || showLoader) {
    return <Loading />
  }

  // ✅ Unauthenticated screen layout (e.g. login page)
  if (!session) {
    return (
      <div className="flex h-screen bg-background">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    );
  }

  // ✅ Authenticated workspace layout with Sidebar
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="bg-background flex flex-col flex-1 overflow-hidden">
        {/* Header bar with toggle trigger — only shown when collapsed */}
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
