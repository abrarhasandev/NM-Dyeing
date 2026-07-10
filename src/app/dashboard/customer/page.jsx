"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");
      toast.success("Customer deleted!");
      fetchCustomers();
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
    <div className="min-h-screen bg-[#f7f7f4] dark:bg-[#161616] p-4 md:p-8 font-sans selection:bg-[#26251e] dark:selection:bg-[#f7f7f4] selection:text-[#f7f7f4] dark:selection:text-[#161616]">
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
              <div className="bg-[#e6e5e0] dark:bg-[#2c2c2c] p-2 rounded-[4px]">
                <Users className="text-[#26251e] dark:text-[#f7f7f4]" size={24} />
              </div>
              <h1 className="text-3xl font-medium text-[#26251e] dark:text-[#f7f7f4] tracking-tight">Customer Management</h1>
            </div>
          </div>
          <Link
            href="/dashboard/customer/createCustomer"
            className="inline-flex items-center justify-center gap-2 bg-[#26251e] dark:bg-[#f7f7f4] hover:bg-[#3b3a33] dark:hover:bg-[#e0e0e0] text-[#f7f7f4] dark:text-[#161616] px-6 py-2.5 rounded-[4px] font-medium transition-all duration-200 shadow-[0_0_0_1px_rgba(38,37,30,0.1)] dark:shadow-[0_0_0_1px_rgba(247,247,244,0.1)] hover:shadow-md"
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
          <motion.div variants={itemVariants} className="bg-[#f2f1ed] dark:bg-[#1c1c1c] p-6 rounded-[4px] border border-[#26251e]/5 dark:border-[#f7f7f4]/5 shadow-[0_0_0_1px_rgba(38,37,30,0.05),0_4px_6px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-[#26251e]/15 dark:hover:border-[#f7f7f4]/15 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase size={64} />
            </div>
            <p className="text-xs font-semibold text-[#050503]/50 dark:text-[#f7f7f4]/50 uppercase tracking-widest mb-1">Total Clients</p>
            <p className="text-4xl font-light text-[#26251e] dark:text-[#f7f7f4]">{customers.length}</p>
          </motion.div>

          {/* Stat Card 2 */}
          <motion.div variants={itemVariants} className="bg-[#f2f1ed] dark:bg-[#1c1c1c] p-6 rounded-[4px] border border-[#26251e]/5 dark:border-[#f7f7f4]/5 shadow-[0_0_0_1px_rgba(38,37,30,0.05),0_4px_6px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-[#26251e]/15 dark:hover:border-[#f7f7f4]/15 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 size={64} />
            </div>
            <p className="text-xs font-semibold text-[#050503]/50 dark:text-[#f7f7f4]/50 uppercase tracking-widest mb-1">Active Companies</p>
            <p className="text-4xl font-light text-[#26251e] dark:text-[#f7f7f4]">{customers.length}</p>
          </motion.div>

          {/* Stat Card 3 */}
          <motion.div variants={itemVariants} className="bg-[#f2f1ed] dark:bg-[#1c1c1c] p-6 rounded-[4px] border border-[#26251e]/5 dark:border-[#f7f7f4]/5 shadow-[0_0_0_1px_rgba(38,37,30,0.05),0_4px_6px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-[#26251e]/15 dark:hover:border-[#f7f7f4]/15 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={64} />
            </div>
            <p className="text-xs font-semibold text-[#050503]/50 dark:text-[#f7f7f4]/50 uppercase tracking-widest mb-1">Monthly Growth</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-light text-[#26251e] dark:text-[#f7f7f4]">+12<span className="text-2xl text-[#050503]/40 dark:text-[#f7f7f4]/40">%</span></p>
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#050503]/40 dark:text-[#f7f7f4]/40" size={18} />
          <input
            type="text"
            placeholder="Search by company or owner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#f2f1ed] dark:bg-[#1c1c1c] text-[#26251e] dark:text-[#f7f7f4] placeholder:text-[#050503]/40 dark:placeholder:text-[#f7f7f4]/40 border border-[#26251e]/10 dark:border-[#f7f7f4]/10 rounded-[4px] focus:outline-none focus:border-[#26251e]/30 dark:focus:border-[#f7f7f4]/30 focus:ring-1 focus:ring-[#26251e]/30 dark:focus:ring-[#f7f7f4]/30 transition-all shadow-[0_0_0_1px_rgba(38,37,30,0.05)] dark:[color-scheme:dark] text-sm"
          />
        </motion.div>

        {/* TABLE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-[#f2f1ed] dark:bg-[#1c1c1c] rounded-[4px] border border-[#26251e]/10 dark:border-[#f7f7f4]/10 shadow-[0_0_0_1px_rgba(38,37,30,0.05),0_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#26251e]/10 dark:border-[#f7f7f4]/10 bg-[#ebeae5]/50 dark:bg-[#2c2c2c]/50">
                  <th className="px-6 py-4 text-xs font-semibold text-[#050503]/60 dark:text-[#f7f7f4]/60 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#050503]/60 dark:text-[#f7f7f4]/60 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#050503]/60 dark:text-[#f7f7f4]/60 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#050503]/60 dark:text-[#f7f7f4]/60 uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#050503]/60 dark:text-[#f7f7f4]/60 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26251e]/5 dark:divide-[#f7f7f4]/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-[#050503]/40 dark:text-[#f7f7f4]/40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26251e] dark:border-[#f7f7f4]"></div>
                        <p className="text-sm font-medium animate-pulse">Loading customers...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  <AnimatePresence>
                    {filteredData.map((c, idx) => (
                      <motion.tr
                        key={c._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
                        className="hover:bg-[#ebeae5] dark:hover:bg-[#2c2c2c] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[#26251e] dark:text-[#f7f7f4]">{c.companyName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#050503]/70 dark:text-[#f7f7f4]/70">{c.ownerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#050503]/70 dark:text-[#f7f7f4]/70 font-mono text-xs bg-[#e6e5e0]/50 dark:bg-[#2c2c2c]/50 px-2 py-1 rounded-[4px] border border-[#26251e]/5 dark:border-[#f7f7f4]/5 inline-block">{c.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[150px] truncate text-xs text-[#050503]/60 dark:text-[#f7f7f4]/60 bg-[#e6e5e0] dark:bg-[#2c2c2c] px-2.5 py-1 rounded-full inline-block border border-[#26251e]/5 dark:border-[#f7f7f4]/5">
                            {c.employeeList?.length ? c.employeeList.join(", ") : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/customer/profile/${c?._id}`}
                              className="p-2 text-[#050503]/60 dark:text-[#f7f7f4]/60 hover:text-[#26251e] dark:hover:text-[#f7f7f4] hover:bg-[#e6e5e0] dark:hover:bg-[#2c2c2c] rounded-[4px] transition-all"
                              title="View Profile"
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/dashboard/customer/edit/${c._id}`}
                              className="p-2 text-[#050503]/60 dark:text-[#f7f7f4]/60 hover:text-[#26251e] dark:hover:text-[#f7f7f4] hover:bg-[#e6e5e0] dark:hover:bg-[#2c2c2c] rounded-[4px] transition-all"
                              title="Edit Customer"
                            >
                              <Pencil size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(c._id)}
                              className="p-2 text-[#050503]/60 dark:text-[#f7f7f4]/60 hover:text-[#cf2d56] dark:hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 dark:hover:bg-[#cf2d56]/20 rounded-[4px] transition-all cursor-pointer"
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
                      <div className="flex flex-col items-center justify-center text-[#050503]/40 dark:text-[#f7f7f4]/40">
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