// @ts-nocheck
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  Building2,
  Briefcase
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

  const filteredData = customers.filter(c =>
    c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                        className="hover:bg-accent/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-foreground">{c.companyName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-muted-foreground">{c.ownerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md border border-border inline-block">{c.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[150px] truncate text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full inline-block border border-border font-medium">
                            {c.employeeList?.length ? c.employeeList.join(", ") : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/customer/profile/${c?._id}`}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all border border-transparent hover:border-border shadow-sm hover:shadow"
                              title="View Profile"
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/dashboard/customer/edit/${c.mongoId || c._id}`}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all border border-transparent hover:border-border shadow-sm hover:shadow"
                              title="Edit Customer"
                            >
                              <Pencil size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(c.mongoId || c._id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all border border-transparent hover:border-destructive/20 shadow-sm hover:shadow cursor-pointer"
                              title="Delete Customer"
                            >
                              <Trash2 size={16} />
                            </button>
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
