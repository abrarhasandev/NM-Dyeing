"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  Gauge,
  CircleDot,
} from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function TransportEmployeeProfile() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const employee = useQuery(api.transportEmployees.getEmployeeById, employeeId ? { id: employeeId as Id<"transportEmployees"> } : "skip");

  useDocumentTitle(employee?.name ? `${employee.name} — Transport` : "Employee Profile");

  // Loading state (undefined = still fetching; null = not found)
  if (employee === undefined) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading transport employee...
          </p>
        </div>
      </div>
    );
  }

  // Not found
  if (employee === null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Truck size={48} className="opacity-20" />
          <p className="text-sm font-medium">Employee not found</p>
          <button
            onClick={() => router.push("/dashboard/transport")}
            className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            ← Back to Transport
          </button>
        </div>
      </div>
    );
  }

  const createdDate = employee._creationTime
    ? new Date(employee._creationTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Transport
        </motion.button>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="bg-card rounded-lg border border-border shadow-sm p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-sm">
                {employee.avatar ? (
                  <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {employee.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {employee.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    <Truck size={12} />
                    Transport Employee
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} />
                    Added {createdDate}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/dashboard/transport/edit/${employeeId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all shadow-sm hover:shadow-md"
            >
              <Pencil size={15} />
              Edit
            </Link>
          </div>
        </motion.div>

        {/* Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card rounded-lg border border-border shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Personal Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Full Name
                </p>
                <p className="text-sm font-medium text-foreground">{employee.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Age
                </p>
                <p className="text-sm font-medium text-foreground">{employee.age} years</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Address
                </p>
                <div className="flex items-start gap-1.5">
                  <MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground">
                    {typeof employee.address === 'string' ? (
                      <p>{employee.address}</p>
                    ) : (
                      <div className="space-y-2">
                        {employee.address?.nid?.district && (
                          <p><span className="font-medium text-muted-foreground">NID:</span> {employee.address.nid.street ? employee.address.nid.street + ", " : ""}{employee.address.nid.union ? employee.address.nid.union + ", " : ""}{employee.address.nid.upazila}, {employee.address.nid.district}, {employee.address.nid.division}</p>
                        )}
                        {employee.address?.permanent?.district && (
                          <p><span className="font-medium text-muted-foreground">Permanent:</span> {employee.address.permanent.street ? employee.address.permanent.street + ", " : ""}{employee.address.permanent.union ? employee.address.permanent.union + ", " : ""}{employee.address.permanent.upazila}, {employee.address.permanent.district}, {employee.address.permanent.division}</p>
                        )}
                        {employee.address?.current?.district && (
                          <p><span className="font-medium text-muted-foreground">Current:</span> {employee.address.current.street ? employee.address.current.street + ", " : ""}{employee.address.current.union ? employee.address.current.union + ", " : ""}{employee.address.current.upazila}, {employee.address.current.district}, {employee.address.current.division}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card rounded-lg border border-border shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Phone size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Contact Numbers
              </h2>
            </div>

            <div className="space-y-3">
              {employee.phoneNumbers?.map((phone: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-background rounded-md border border-border px-4 py-3"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone size={12} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Phone {index + 1}
                    </p>
                    <p className="text-sm font-mono font-medium text-foreground">
                      {typeof phone === 'string' ? phone : phone?.number}
                    </p>
                    {typeof phone === 'object' && phone?.accounts?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {phone.accounts.map((acc: string, i: number) => (
                          <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">
                            {acc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Vehicle Information — Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 bg-card rounded-lg border border-border shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Truck size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Vehicle Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-background rounded-md border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={14} className="text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Vehicle Type
                  </p>
                </div>
                <p className="text-lg font-semibold text-foreground">{employee.vehicleType}</p>
              </div>

              <div className="bg-background rounded-md border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CircleDot size={14} className="text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Wheels
                  </p>
                </div>
                <p className="text-lg font-semibold text-foreground">{employee.vehicleWheels}</p>
              </div>

              <div className="bg-background rounded-md border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge size={14} className="text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cloth Capacity
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-semibold text-foreground">
                    {employee.clothCapacityYards?.toLocaleString()}
                  </p>
                  <span className="text-sm text-muted-foreground">yards</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
