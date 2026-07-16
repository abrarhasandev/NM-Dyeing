// @ts-nocheck
"use client";

import React, { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { ArrowLeft, CheckCircle2, FileText, FileDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import useOrders from "@/hooks/useOrders";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TransportBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const employeeId = unwrappedParams.id as Id<"transportEmployees">;
  const router = useRouter();

  const employee = useQuery(api.transportEmployees.getEmployeeById, { id: employeeId });
  useDocumentTitle(employee ? `Billing - ${employee.name}` : "Transport Billing");

  // Fetch unpaid Convex orders
  const convexUnpaidOrders = useQuery(api.transportOrders.listByEmployee, {
    transportEmployeeId: employeeId,
    billingStatus: "unpaid",
  });

  // Fetch billing history (all bills to find which System Orders are paid)
  const bills = useQuery(api.transportBills.listByEmployee, {
    transportEmployeeId: employeeId,
  });

  // Fetch System Orders linked to this transporter
  const { orders: systemOrders, loadingOrders: systemOrdersLoading } = useOrders({
    transporterName: employee?.name || "",
    currentPage: 1,
    itemsPerPage: 1000,
  });

  const unpaidOrders = React.useMemo(() => {
    const convexList = convexUnpaidOrders || [];
    if (!systemOrders || !bills) return convexList;

    const allBilledOrderIds = new Set(bills.flatMap((b) => b.orderIds));
    const unpaidSystemOrders = systemOrders.filter((o: any) => !allBilledOrderIds.has(o._id));

    // Map unpaid System Orders to a similar shape as Convex transport orders
    const mappedSystemOrders = unpaidSystemOrders.map((o: any) => {
      const totalGoj = o.totalGoj !== null && o.totalGoj !== undefined
        ? o.totalGoj
        : (o.tableData?.reduce((sum: number, item: any) => sum + (Number(item.goj) || 0), 0) || 0);
        
      return {
        _id: o._id,
        date: new Date(o.date || o.createdAt).getTime(),
        displayOrderId: o.orderId,
        companyName: o.companyName,
        status: o.status,
        totalGoj,
        isMongo: true, // flag to render differently or route differently
      };
    });

    // Combine and sort by date descending
    const combined = [...convexList, ...mappedSystemOrders];
    return combined.sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
  }, [convexUnpaidOrders, systemOrders, bills]);

  const createBill = useMutation(api.transportBills.createBill);

  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleOrderSelection = (orderId: string) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(orderId)) {
      newSet.delete(orderId);
    } else {
      newSet.add(orderId);
    }
    setSelectedOrderIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === unpaidOrders?.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(unpaidOrders?.map(o => o._id) || []));
    }
  };

  const handleGenerateBill = async () => {
    if (selectedOrderIds.size === 0) return toast.error("Select at least one order to bill");

    const amountNum = parseFloat(totalAmount);
    if (isNaN(amountNum) || amountNum < 0) return toast.error("Enter a valid total amount");

    try {
      setIsGenerating(true);
      await createBill({
        transportEmployeeId: employeeId,
        orderIds: Array.from(selectedOrderIds),
        totalAmount: amountNum,
      });
      toast.success("Bill generated successfully");
      setIsGenerateModalOpen(false);
      setSelectedOrderIds(new Set());
      setTotalAmount("");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate bill");
    } finally {
      setIsGenerating(false);
    }
  };

  if (employee === undefined) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (employee === null) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Employee not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-4 px-4 md:px-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/transport/${employee._id}/orders`} className="p-2 hover:bg-accent rounded-full transition-colors border border-transparent hover:border-border">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-sm">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-primary">
                  {employee.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.name}'s Billing</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unpaid Orders Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-[600px]">
          <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Unpaid Orders
                <span className="bg-[#f54e00]/10 text-[#f54e00] text-xs px-2 py-0.5 rounded-full font-bold">
                  {unpaidOrders?.length || 0}
                </span>
              </h2>
            </div>
            <button
              onClick={() => {
                if (selectedOrderIds.size === 0) {
                  toast.error("Please select at least one order to generate a bill.");
                  return;
                }
                setIsGenerateModalOpen(true);
              }}
              disabled={selectedOrderIds.size === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-semibold shadow-sm ${selectedOrderIds.size > 0
                  ? "bg-[#1f8a65] hover:bg-[#186a4e] text-white cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                }`}
            >
              <FileDown size={16} />
              Generate Bill
            </button>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {unpaidOrders === undefined ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : unpaidOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <CheckCircle2 size={48} className="text-[#1f8a65]/50 mb-3" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm opacity-70 mt-1">No unpaid orders left for this employee.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-card shadow-sm border-b border-border z-10">
                  <tr className="text-xs font-semibold text-muted-foreground">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.size === unpaidOrders.length && unpaidOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-border accent-primary cursor-pointer w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Total Goj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unpaidOrders.map(order => (
                    <tr
                      key={order._id}
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => toggleOrderSelection(order._id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.has(order._id)}
                          onChange={() => toggleOrderSelection(order._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-border accent-primary cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground">
                        {order.displayOrderId}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                        {order.totalGoj?.toLocaleString() || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Billing History Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-[600px]">
          <div className="p-5 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Billing History
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {bills === undefined ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText size={48} className="opacity-20 mb-3" />
                <p className="font-medium">No bills generated yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-card shadow-sm border-b border-border z-10">
                  <tr className="text-xs font-semibold text-muted-foreground">
                    <th className="px-4 py-3">Bill Number</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bills.map(bill => (
                    <tr
                      key={bill._id}
                      className="hover:bg-accent/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/dashboard/transport/billing/${bill._id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-sm text-foreground flex items-center gap-2">
                        <FileText size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        {bill.billNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(bill.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="bg-accent text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                          {bill.orderIds.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                        ৳ {bill.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Generate Bill Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Bill</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-accent/50 rounded-lg p-3 text-sm flex justify-between items-center border border-border">
              <span className="text-muted-foreground font-medium">Selected Orders:</span>
              <span className="font-bold text-foreground text-lg">{selectedOrderIds.size}</span>
            </div>
            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Total Amount (৳)
              </label>
              <input
                id="amount"
                type="number"
                placeholder="Enter total amount..."
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 bg-transparent text-foreground hover:bg-accent rounded-md transition-colors text-sm font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateBill}
              disabled={isGenerating || !totalAmount}
              className="px-4 py-2 bg-[#f54e00] hover:bg-[#d44300] disabled:bg-[#f54e00]/50 text-white rounded-md transition-colors text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? "Generating..." : "Confirm & Bill"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
