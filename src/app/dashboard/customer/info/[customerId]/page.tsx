"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  Briefcase,
  Building,
  CreditCard,
  Smartphone,
} from "lucide-react";

export default function CustomerProfileInfo() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<any>(undefined);

  useEffect(() => {
    if (!customerId) return;
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const data = await res.json();
        if (res.ok) {
          setCustomer(data);
        } else {
          setCustomer(null);
          toast.error(data.error || "Failed to load customer");
        }
      } catch (error) {
        setCustomer(null);
        toast.error("Error fetching customer");
      }
    };
    fetchCustomer();
  }, [customerId]);

  const titleName = customer?.companyName || (customer?.owners?.length > 0 ? customer.owners[0].name : "Individual Customer");
  useDocumentTitle(customer ? `${titleName} — Customer Profile` : "Customer Profile");

  // Loading state
  if (customer === undefined) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading customer profile...
          </p>
        </div>
      </div>
    );
  }

  // Not found
  if (customer === null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <User size={48} className="opacity-20" />
          <p className="text-sm font-medium">Customer not found</p>
          <button
            onClick={() => router.push("/dashboard/customer")}
            className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            ← Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const createdDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Customers
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
                <span className="text-2xl font-bold text-primary">
                  {titleName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {titleName}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {customer.customerType === "Company" ? <Building2 size={12} /> : <User size={12} />}
                    {customer.customerType || "Customer"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} />
                    Added {createdDate}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/dashboard/customer/edit/${customerId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all shadow-sm hover:shadow-md"
            >
              <Pencil size={15} />
              Edit
            </Link>
          </div>
        </motion.div>

        {/* Detail Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Owners Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card rounded-lg border border-border shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Owner(s)
              </h2>
            </div>
            <div className="space-y-4">
              {customer.owners?.length > 0 ? (
                customer.owners.map((owner: any, index: number) => (
                  <div key={index} className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{owner.name}</p>
                    {owner.phone && <p className="text-xs text-muted-foreground font-mono">{owner.phone}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No owner information provided.</p>
              )}
            </div>
          </motion.div>

          {/* Contact Numbers */}
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
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {customer.phoneNumber?.length > 0 ? (
                customer.phoneNumber.map((phone: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 bg-background rounded-md border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone size={12} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          {phone.ownerName || `Phone ${index + 1}`}
                          {phone.isPrimary && (
                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Primary</span>
                          )}
                        </p>
                        <p className="text-sm font-mono font-medium text-foreground">
                          {phone.number}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No phone numbers provided.</p>
              )}
            </div>
          </motion.div>

          {/* Addresses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 bg-card rounded-lg border border-border shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Addresses
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customer.address?.length > 0 ? (
                customer.address.map((addr: any, index: number) => (
                  <div key={index} className="bg-background rounded-md border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {addr.type || "Address"}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {[addr.street, addr.union, addr.upazila, addr.district, addr.division].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No addresses provided.</p>
              )}
            </div>
          </motion.div>

          {/* Bank & Mobile Banking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="md:col-span-2 bg-card rounded-lg border border-border shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Building size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Financial Details
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Bank Accounts */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                  <CreditCard size={14} /> Bank Accounts
                </p>
                <div className="space-y-3">
                  {customer.bankAccounts?.length > 0 ? (
                    customer.bankAccounts.map((acc: any, index: number) => (
                      <div key={index} className="bg-background rounded-md border border-border p-3 flex flex-col gap-1">
                        <p className="text-sm font-semibold text-foreground">{acc.bankName}</p>
                        <p className="text-xs text-muted-foreground">{acc.accountName}</p>
                        <p className="text-xs font-mono font-medium text-foreground">{acc.accountNumber}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No bank accounts.</p>
                  )}
                </div>
              </div>

              {/* Mobile Banking */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                  <Smartphone size={14} /> Mobile Banking
                </p>
                <div className="space-y-3">
                  {customer.mobileBanking?.length > 0 ? (
                    customer.mobileBanking.map((mb: any, index: number) => (
                      <div key={index} className="bg-background rounded-md border border-border p-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{mb.provider}</p>
                        <p className="text-sm font-mono font-medium text-foreground">{mb.number}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No mobile banking details.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Employees List */}
          {customer.employeeList?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="md:col-span-2 bg-card rounded-lg border border-border shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Briefcase size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Employee Contacts
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {customer.employeeList.map((emp: any, index: number) => (
                  <div key={index} className="bg-background rounded-md border border-border p-4 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">{emp.name || (typeof emp === "string" ? emp : "—")}</p>
                    {typeof emp === "object" && (
                      <>
                        {emp.designation && <p className="text-xs text-muted-foreground">{emp.designation}</p>}
                        {emp.phone && <p className="text-xs font-mono text-foreground mt-1">{emp.phone}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
