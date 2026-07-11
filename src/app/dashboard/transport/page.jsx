"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
  Truck,
  Users,
  Gauge,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const TransportPage = () => {
  const employees = useQuery(api.transportEmployees.list);
  const removeEmployee = useMutation(api.transportEmployees.remove);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useDocumentTitle("Transport Management");

  const loading = employees === undefined;

  const filteredData = (employees || []).filter(
    (e) => {
      const addressString = typeof e.address === 'string'
        ? e.address
        : `${e.address?.nid?.division || ''} ${e.address?.nid?.district || ''} ${e.address?.nid?.upazila || ''} ${e.address?.nid?.union || ''} ${e.address?.nid?.street || ''}`;

      return (
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addressString?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );

  const totalCapacity = (employees || []).reduce(
    (sum, e) => sum + (e.clothCapacityYards || 0),
    0
  );

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this transport employee?"))
      return;
    try {
      setDeletingId(id);
      await removeEmployee({ id });
      toast.success("Transport employee deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete employee");
    } finally {
      setDeletingId(null);
    }
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
                {loading ? "—" : employees.length}
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
                {loading ? "—" : employees.length}
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
                <p className="text-3xl font-bold text-foreground">
                  {loading ? "—" : totalCapacity.toLocaleString()}
                </p>
                {!loading && (
                  <span className="text-sm text-muted-foreground font-medium">
                    yards
                  </span>
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
            placeholder="Search by name, vehicle type, or address..."
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm font-medium animate-pulse">
                          Loading transport employees...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  <AnimatePresence>
                    {filteredData.map((emp, idx) => (
                      <motion.tr
                        key={emp._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(idx * 0.04, 0.5),
                        }}
                        className={`hover:bg-accent/50 transition-colors group cursor-pointer ${deletingId === emp._id ? "opacity-50" : ""
                          }`}
                      >
                        {/* Name + Age */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-semibold text-primary">
                                {emp.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {emp.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
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
                              {typeof emp.address === 'string'
                                ? emp.address
                                : emp.address?.nid?.district
                                  ? `${emp.address.nid.district}, ${emp.address.nid.division}`
                                  : 'View for details'}
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
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/transport/profile/${emp._id}`}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all border border-transparent hover:border-border shadow-sm hover:shadow"
                              title="View Profile"
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/dashboard/transport/edit/${emp._id}`}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all border border-transparent hover:border-border shadow-sm hover:shadow"
                              title="Edit Employee"
                            >
                              <Pencil size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(emp._id)}
                              disabled={deletingId === emp._id}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all border border-transparent hover:border-destructive/20 shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
                              title="Delete Employee"
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
                    <td colSpan={6} className="py-24">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Truck size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">
                          {searchQuery
                            ? "No employees found matching your search."
                            : "No transport employees yet. Add your first employee!"}
                        </p>
                        {!searchQuery && (
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
        </motion.div>
      </div>
    </div>
  );
};

export default TransportPage;
