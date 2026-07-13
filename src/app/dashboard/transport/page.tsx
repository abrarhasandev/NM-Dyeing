"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Truck,
  Users,
  Gauge,
  Phone,
  MapPin,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { ITransportEmployee } from "@/types/transport";
import { Id } from "../../../../convex/_generated/dataModel";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function TransportPage() {
  useDocumentTitle("Transport Management");
  
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const stats = useQuery(api.transportEmployees.getStats);
  const {
    results,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.transportEmployees.getEmployees,
    { searchTerm: debouncedSearch || undefined },
    { initialNumItems: 10 }
  );
  
  const employees = results as ITransportEmployee[];
  const deleteEmployee = useMutation(api.transportEmployees.deleteEmployee);

  const statsLoading = stats === undefined;
  const listLoading = status === "LoadingFirstPage";

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transport employee?"))
      return;
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

  const getAddressString = (address: any) => {
    if (typeof address === 'string') return address;
    if (address?.nid?.district) {
      return `${address.nid.district}, ${address.nid.division}`;
    }
    return 'View for details';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
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
        </motion.div>

        {/* STATS SECTION */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Total Employees */}
          <motion.div
            variants={itemVariants}
            className="bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden group hover:border-border/80 transition-colors h-[130px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users size={64} />
            </div>
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Employees
              </p>
            </div>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-foreground">
                {statsLoading ? (
                   <span className="inline-block w-16 h-8 bg-muted rounded-md animate-pulse"></span>
                ) : (
                   stats.totalEmployees
                )}
              </p>
            </div>
          </motion.div>

          {/* Total Vehicles */}
          <motion.div
            variants={itemVariants}
            className="bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden group hover:border-border/80 transition-colors h-[130px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Truck size={64} />
            </div>
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Vehicles
              </p>
            </div>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-foreground">
                {statsLoading ? (
                   <span className="inline-block w-16 h-8 bg-muted rounded-md animate-pulse"></span>
                ) : (
                   stats.totalVehicles
                )}
              </p>
            </div>
          </motion.div>

          {/* Total Capacity */}
          <motion.div
            variants={itemVariants}
            className="bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden group hover:border-border/80 transition-colors h-[130px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Gauge size={64} />
            </div>
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Capacity
              </p>
            </div>
            <div className="flex flex-col mt-2">
              <div className="flex items-baseline gap-1">
                {statsLoading ? (
                  <span className="inline-block w-24 h-8 bg-muted rounded-md animate-pulse"></span>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-foreground">
                      {stats.totalCapacity.toLocaleString()}
                    </p>
                    <span className="text-sm text-muted-foreground font-medium">
                      yards
                    </span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* SEARCH BAR */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative max-w-md"
        >
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search employees by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-card text-foreground placeholder:text-muted-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all shadow-sm text-sm"
          />
        </motion.div>

        {/* TABLE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {listLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-32 bg-muted rounded-md"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-muted rounded-md"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-48 bg-muted rounded-md"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-muted rounded-md"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-16 bg-muted rounded-md"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-muted rounded-md ml-auto"></div></td>
                    </tr>
                  ))
                ) : employees.length > 0 ? (
                  <AnimatePresence>
                    {employees.map((emp, idx) => (
                      <motion.tr
                        key={emp._id}
                        onClick={() => router.push(`/dashboard/transport/${emp._id}/orders`)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(idx * 0.04, 0.5),
                        }}
                        className={`hover:bg-accent/50 transition-colors group cursor-pointer ${
                          deletingId === emp._id ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {/* Name + Age */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-border">
                              {emp.avatar ? (
                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-semibold text-primary">
                                  {emp.name?.charAt(0)?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <Link 
                                href={`/dashboard/transport/profile/${emp._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                              >
                                {emp.name}
                              </Link>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Age: {emp.age}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {emp.phoneNumbers?.slice(0, 2).map((phone, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                              >
                                <Phone size={11} className="shrink-0" />
                                <span className="font-mono">
                                  {typeof phone === 'string' ? phone : phone?.number}
                                </span>
                              </div>
                            ))}
                            {emp.phoneNumbers?.length > 2 && (
                              <span className="text-xs text-muted-foreground/70">
                                +{emp.phoneNumbers.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Address */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground max-w-[180px]">
                            <MapPin size={13} className="shrink-0" />
                            <span className="truncate">
                              {getAddressString(emp.address)}
                            </span>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary/60 px-2.5 py-1 rounded-md border border-border">
                            <Truck size={12} />
                            <span>
                              {emp.vehicleType} · {emp.vehicleWheels}W
                            </span>
                          </div>
                        </td>

                        {/* Capacity */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-foreground">
                            {emp.clothCapacityYards?.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            yards
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all outline-none">
                                <MoreVertical size={16} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/transport/profile/${emp._id}`} className="cursor-pointer flex items-center gap-2">
                                    <Eye size={14} />
                                    <span>View Profile</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/transport/edit/${emp._id}`} className="cursor-pointer flex items-center gap-2">
                                    <Pencil size={14} />
                                    <span>Edit</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(emp._id)}
                                  disabled={deletingId === emp._id}
                                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                ) : (
                  <tr>
                    <td colSpan={6} className="py-24">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Truck size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">
                          {debouncedSearch
                            ? "No employees found matching your search."
                            : "No transport employees yet. Add your first employee!"}
                        </p>
                        {!debouncedSearch && (
                          <Link
                            href="/dashboard/transport/createEmployee"
                            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            <Plus size={16} />
                            Add Employee
                            <ChevronRight size={14} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {status === "CanLoadMore" && (
             <div className="p-4 border-t border-border flex justify-center bg-muted/20">
               <button
                 onClick={() => loadMore(10)}
                 className="px-6 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors inline-flex items-center gap-2"
               >
                 Load More
               </button>
             </div>
          )}
          {status === "LoadingMore" && (
             <div className="p-4 border-t border-border flex justify-center bg-muted/20">
               <div className="flex items-center gap-2 text-muted-foreground text-sm">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
                 Loading more...
               </div>
             </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
