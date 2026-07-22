// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Search, Truck, AlertTriangle, RefreshCcw } from "lucide-react";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import { TransportStatsCards } from "@/components/transport/TransportStatsCards";
import { TransportEmployeeTable } from "@/components/transport/TransportEmployeeTable";
import type { TransportEmployeeDoc, TransportStats } from "@/types/transport";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function TransportPage() {
  useDocumentTitle("Transport Management");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const stats = useQuery(api.transportEmployees.getStats) as
    | TransportStats
    | undefined;

  const queryArgs = useMemo(
    () => ({
      searchTerm: debouncedSearch || undefined,
    }),
    [debouncedSearch]
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.transportEmployees.getEmployees,
    queryArgs,
    { initialNumItems: 10 }
  );

  const employees = (results ?? []) as TransportEmployeeDoc[];
  const deleteEmployee = useMutation(api.transportEmployees.deleteEmployee);

  const statsLoading = stats === undefined;
  const listLoading = status === "LoadingFirstPage";

  // Debugging logs added here:
  useEffect(() => {
    console.log("🛠️ [TransportPage] Query Status:", status);
    console.log("🛠️ [TransportPage] Employees List Loading:", listLoading);
    console.log("🛠️ [TransportPage] Employees Data:", results);
    console.log("🛠️ [TransportPage] Stats Data:", stats);
  }, [status, listLoading, results, stats]);

  /**
   * If Convex never resolves past the first page (missing function / network),
   * surface a recovery UI instead of infinite skeletons.
   */
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  useEffect(() => {
    if (!listLoading) {
      setLoadTimedOut(false);
      return;
    }
    const t = setTimeout(() => setLoadTimedOut(true), 12_000);
    return () => clearTimeout(t);
  }, [listLoading, debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transport employee?")) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteEmployee({ id: id as Id<"transportEmployees"> });
      toast.success("Transport employee deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete employee");
    } finally {
      setDeletingId(null);
    }
  };

  if (loadTimedOut && listLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="bg-card border border-border shadow-sm rounded-lg p-8 max-w-md w-full text-center space-y-5">
          <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">
              Unable to load transport employees
            </h2>
            <p className="text-sm text-muted-foreground">
              Convex did not return data in time. This usually means the backend
              functions are not deployed, or the connection to Convex failed.
              Ensure <code className="text-xs">npx convex deploy</code> has been
              run for this project.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-md font-medium transition-all shadow-sm"
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent p-2.5 rounded-md">
                <Truck className="text-foreground" size={26} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Transport Management
                </h1>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/transport/createEmployee"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            <span>Add Employee</span>
          </Link>
        </div>

        <TransportStatsCards stats={stats} isLoading={statsLoading} />

        <div className="relative max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="search"
            placeholder="Search employees by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-card text-foreground placeholder:text-muted-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all shadow-sm text-sm"
            aria-label="Search transport employees"
          />
        </div>

        <TransportEmployeeTable
          employees={employees}
          listLoading={listLoading}
          deletingId={deletingId}
          debouncedSearch={debouncedSearch}
          onDelete={handleDelete}
          status={status}
          onLoadMore={() => loadMore(10)}
        />
      </div>
    </div>
  );
}
