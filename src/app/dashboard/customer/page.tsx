// @ts-nocheck
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
  Users,
  TrendingUp,
  Building2,
  Briefcase,
  MoreVertical,
  FileText
} from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const CustomerPage = () => {
  const router = useRouter();
  const { customers, isLoading: loading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");

  useDocumentTitle("Customer Management");

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");
      toast.success("Customer deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete customer");
    }
  };

  const filteredData = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const companyMatch = c.companyName?.toLowerCase().includes(searchLower) || (c.customerType === "Individual" && "individual".includes(searchLower));
    const oldOwnerMatch = c.ownerName?.toLowerCase().includes(searchLower);
    const newOwnerMatch = Array.isArray(c.owners) && c.owners.some(o => o.name.toLowerCase().includes(searchLower));
    const phoneMatch = Array.isArray(c.phoneNumber) ? c.phoneNumber.some(p => p.number.includes(searchLower)) : c.phoneNumber?.includes(searchLower);
    return companyMatch || oldOwnerMatch || newOwnerMatch || phoneMatch;
  });

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
              <div className="bg-accent p-2 rounded-md">
                <Users className="text-foreground" size={24} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Customer Management</h1>
            </div>
          </div>
          <Link
            href="/dashboard/customer/createCustomer"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-md font-medium transition-all duration-200 shadow-sm"
          >
            <Plus size={18} />
            <span>Create Customer</span>
          </Link>
        </motion.div>

        {/* STATS SECTION */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Stat Card 1 */}
          <motion.div variants={itemVariants} className="bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden group hover:border-border/80 transition-colors h-[130px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase size={64} />
            </div>
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Clients</p>
            </div>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-foreground">{customers.length}</p>
            </div>
          </motion.div>

          {/* Stat Card 2 */}
          <motion.div variants={itemVariants} className="bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden group hover:border-border/80 transition-colors h-[130px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 size={64} />
            </div>
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Companies</p>
            </div>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-foreground">{customers.length}</p>
            </div>
          </motion.div>

          {/* Stat Card 3 */}
          <motion.div variants={itemVariants} className="bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden group hover:border-border/80 transition-colors h-[130px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={64} />
            </div>
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Growth</p>
            </div>
            <div className="flex flex-col mt-2">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">+12<span className="text-xl text-muted-foreground ml-1">%</span></p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* SEARCH & FILTER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by company or owner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-border bg-card" style={{ opacity: 1 - i * 0.15 }}>
                        <td className="px-6 py-4"><div className="mn-skeleton h-4 w-32 rounded-sm" /></td>
                        <td className="px-6 py-4"><div className="mn-skeleton h-4 w-24 rounded-sm" /></td>
                        <td className="px-6 py-4"><div className="mn-skeleton h-6 w-24 rounded-sm" /></td>
                        <td className="px-6 py-4"><div className="mn-skeleton h-6 w-24 rounded-full" /></td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1.5">
                            <div className="mn-skeleton h-8 w-8 rounded-md" />
                            <div className="mn-skeleton h-8 w-8 rounded-md" />
                            <div className="mn-skeleton h-8 w-8 rounded-md" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filteredData.length > 0 ? (
                  <AnimatePresence>
                    {filteredData.map((c, idx) => (
                      <motion.tr
                        key={c.mongoId || c._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
                        onClick={() => router.push(`/dashboard/customer/profile/${c.mongoId || c._id}`)}
                        className="hover:bg-accent/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div 
                            className="text-sm font-semibold text-foreground flex items-center gap-2 hover:text-primary transition-colors inline-flex"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              router.push(`/dashboard/customer/info/${c.mongoId || c._id}`); 
                            }}
                          >
                            {c.companyName || (c.customerType === "Individual" ? "Individual" : "—")}
                            {c.customerType === "Individual" && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Ind.</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-muted-foreground">
                            {Array.isArray(c.owners) && c.owners.length > 0 
                              ? c.owners.map(o => o.name).join(', ')
                              : (c.ownerName || "—")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md border border-border inline-block max-w-[200px] truncate">
                            {Array.isArray(c.phoneNumber) && c.phoneNumber.length > 0
                              ? c.phoneNumber.map(p => p.number).join(', ')
                              : (c.phoneNumber || "—")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[150px] truncate text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full inline-block border border-border font-medium">
                            {Array.isArray(c.employeeList) && c.employeeList.length > 0
                              ? (typeof c.employeeList[0] === 'object' ? `${c.employeeList.length} Employees` : c.employeeList.join(", "))
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className="flex justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all outline-none">
                                <MoreVertical size={16} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 border-border bg-card"
                              >
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/customer/info/${c.mongoId || c._id}`}
                                    className="cursor-pointer flex items-center gap-2"
                                  >
                                    <Eye size={14} />
                                    <span>Profile Section</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/customer/edit/${c.mongoId || c._id}`}
                                    className="cursor-pointer flex items-center gap-2"
                                  >
                                    <Pencil size={14} />
                                    <span>Edit Section</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/customer/profile/${c.mongoId || c._id}?tab=ledger`}
                                    className="cursor-pointer flex items-center gap-2"
                                  >
                                    <FileText size={14} />
                                    <span>Ledger Statement</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toast.error("Delete action is temporarily disabled.");
                                  }}
                                  disabled={true}
                                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2 opacity-50"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete Customer</span>
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
                    <td colSpan={5} className="py-24">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">No customers found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerPage;
