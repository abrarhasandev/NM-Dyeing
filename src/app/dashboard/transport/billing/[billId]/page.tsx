// @ts-nocheck
"use client";

import React, { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { ArrowLeft, Printer, Trash2, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import useOrders from "@/hooks/useOrders";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BillDetailsPage({ params }: { params: Promise<{ billId: string }> }) {
  const unwrappedParams = use(params);
  const billId = unwrappedParams.billId as Id<"transportEmployeeBills">;
  const router = useRouter();

  const bill = useQuery(api.transportBills.getBillDetails, { id: billId });
  const employee = useQuery(api.transportEmployees.getEmployeeById, {
    id: bill?.transportEmployeeId as Id<"transportEmployees">,
  });

  const { orders: systemOrders } = useOrders({ 
    transporterName: employee?.name || "",
    currentPage: 1,
    itemsPerPage: 1000,
  });

  const populatedOrders = React.useMemo(() => {
    if (!bill) return [];
    return bill.populatedOrders.map((o: any) => {
      if (o.isMongo) {
        // Find the mongo order
        const sysOrder = systemOrders?.find((so: any) => so._id === o._id);
        if (sysOrder) {
          return {
            ...sysOrder,
            displayOrderId: sysOrder.orderId,
            date: new Date(sysOrder.date || sysOrder.createdAt).getTime(),
          };
        }
        return { displayOrderId: "Loading...", date: Date.now(), companyName: "...", totalGoj: 0 };
      }
      return o;
    });
  }, [bill, systemOrders]);

  const deleteBill = useMutation(api.transportBills.deleteBill);

  useDocumentTitle(bill ? `Bill ${bill.billNumber}` : "Bill Details");

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    try {
      await deleteBill({ id: billId });
      toast.success("Bill deleted successfully");
      if (employee) {
        router.push(`/dashboard/transport/${employee._id}/billing`);
      } else {
        router.push(`/dashboard/transport`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete bill");
    }
  };

  if (bill === undefined || (bill && employee === undefined)) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (bill === null) {
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <FileText size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-xl font-semibold text-foreground">Bill not found</p>
        <p className="text-muted-foreground mt-2">The bill may have been deleted.</p>
        <button 
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-4 px-4 md:px-8 pb-10">
      {/* Header (Hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link 
            href={employee ? `/dashboard/transport/${employee._id}/billing` : "/dashboard/transport"}
            className="p-2 hover:bg-accent rounded-full transition-colors border border-transparent hover:border-border"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Bill <span className="text-muted-foreground font-mono text-xl">{bill.billNumber}</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-red-500/10 text-red-600 rounded-md transition-colors text-sm font-semibold border border-red-200">
                <Trash2 size={16} />
                Delete Bill
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the bill and restore all associated orders back to unpaid status.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                  Yes, delete bill
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f8a65] hover:bg-[#186a4e] text-white rounded-md transition-colors text-sm font-semibold shadow-sm"
          >
            <Printer size={16} />
            Print Bill
          </button>
        </div>
      </div>

      {/* Printable Invoice Area */}
      <div className="bg-card border border-border rounded-lg shadow-sm max-w-4xl mx-auto w-full p-8 md:p-12 print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-3xl font-black text-foreground mb-1">NM Dyeing</h2>
            <p className="text-muted-foreground text-sm">Transport Billing Invoice</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold font-mono text-foreground">{bill.billNumber}</h3>
            <p className="text-muted-foreground text-sm flex items-center gap-1 justify-end mt-1">
              <Calendar size={14} />
              {new Date(bill.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Billed To:</p>
            {employee ? (
              <div>
                <p className="text-lg font-bold text-foreground">{employee.name}</p>
                <p className="text-muted-foreground">{
                  employee.phoneNumbers && employee.phoneNumbers.length > 0 
                    ? (typeof employee.phoneNumbers[0] === 'string' ? employee.phoneNumbers[0] : employee.phoneNumbers[0].number) 
                    : "No phone number"
                }</p>
                {employee.vehicleType && <p className="text-muted-foreground">Vehicle: {employee.vehicleType}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">Employee details unavailable</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Summary:</p>
            <p className="text-foreground"><span className="font-medium text-muted-foreground">Total Orders:</span> {populatedOrders.length}</p>
            <p className="text-foreground mt-1"><span className="font-medium text-muted-foreground">Status:</span> 
              <span className="inline-flex ml-2 items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#1f8a65]/10 text-[#1f8a65] uppercase">
                {bill.status}
              </span>
            </p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-b-2 border-border text-sm font-bold text-foreground">
              <th className="py-3 px-2">Order ID</th>
              <th className="py-3 px-2">Date</th>
              <th className="py-3 px-2">Company</th>
              <th className="py-3 px-2 text-right">Total Goj</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {populatedOrders.map((order: any, index: number) => (
              <tr key={index} className="text-sm group">
                <td className="py-3 px-2 font-mono text-muted-foreground">{order.displayOrderId}</td>
                <td className="py-3 px-2">{new Date(order.date).toLocaleDateString()}</td>
                <td className="py-3 px-2">{order.companyName}</td>
                <td className="py-3 px-2 text-right font-medium">{order.totalGoj?.toLocaleString() || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between items-center py-3 border-t-2 border-foreground">
              <span className="font-bold text-lg text-foreground">Total Paid:</span>
              <span className="font-bold text-2xl text-foreground">৳ {bill.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-4xl {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .max-w-4xl * {
            visibility: visible;
          }
        }
      `}} />
    </div>
  );
}
