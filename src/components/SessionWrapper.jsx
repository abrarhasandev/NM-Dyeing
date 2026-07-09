"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/Sidebar/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import Loading from "@/app/loading";

function DashboardHeader() {
  const { state } = useSidebar();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-4 border-b border-sidebar-border bg-sidebar transition-all duration-200 ease-in-out">
      {state === "collapsed" && (
        <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      )}
      {state === "collapsed" && (
        <div className="h-4 w-[1px] bg-sidebar-border/30 mx-1" />
      )}
      <span className="text-xs text-sidebar-foreground/60 font-semibold tracking-wide uppercase">Dashboard</span>
    </header>
  );
}

export default function SessionWrapper({ children }) {
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
      <div className="flex h-screen bg-gray-100">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    );
  }

  // ✅ Authenticated workspace layout with Sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-100 flex flex-col flex-1 overflow-hidden">
        {/* Header bar with toggle trigger — only shown when collapsed */}
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
