// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from "react";

import { toast } from "sonner";
import { fmtDate } from "./ledgerUtils";
import SavedInvoicePrint from "@/components/Print/ledger/SavedInvoicePrint";
import { ChevronDown, ChevronUp, Plus, Printer, Trash2, X, Receipt, FileText } from "lucide-react";

function CustomerSavedBillsTab({ customerId, selectedView, availableRows, onInvoiceUpdated, companyAddress }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    const [appendingInvoiceId, setAppendingInvoiceId] = useState(null);
    const [appendSelectedRows, setAppendSelectedRows] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    const [printingInvoice, setPrintingInvoice] = useState(null);
    const printRef = useRef(null);

    useEffect(() => {
        if (customerId) fetchInvoices();
    }, [customerId, selectedView]);

    async function fetchInvoices() {
        setLoading(true);
        try {
            const res = await fetch(`/api/customers/ledger/${customerId}/saved-invoices?view=${selectedView}&_t=${Date.now()}`);
            const data = await res.json();
            if (data.success) {
                setInvoices(data.invoices);
            } else {
                toast.error("Failed to fetch saved invoices");
            }
        } catch {
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = (invoice) => {
        setPrintingInvoice(invoice);
        setTimeout(() => {
            if (!printRef.current) return;
            const printArea = printRef.current.cloneNode(true);
            const tempDiv = document.createElement("div");
            tempDiv.className = "print-only";
            tempDiv.appendChild(printArea);
            document.body.appendChild(tempDiv);

            const images = tempDiv.getElementsByTagName("img");
            const promises = Array.from(images).map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });

            Promise.all(promises).then(() => {
                window.print();
                setTimeout(() => {
                    document.body.removeChild(tempDiv);
                    setPrintingInvoice(null);
                }, 500);
            });
        }, 100);
    };

    const handleRemoveRecord = async (invoiceId, record) => {
        if (!confirm("Are you sure you want to remove this item? It will return to the Current Ledger.")) return;
        try {
            const res = await fetch(`/api/customers/ledger/${customerId}/saved-invoices/${invoiceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "remove", record })
            });
            if (res.ok) {
                toast.success("Item removed from Invoice!");
                fetchInvoices();
                onInvoiceUpdated?.();
            } else {
                toast.error("Failed to remove item");
            }
        } catch {
            toast.error("Server error");
        }
    };

    const handleAppend = async () => {
        if (!appendSelectedRows.length) return;
        setActionLoading(true);
        const totalCharge = appendSelectedRows.reduce((acc, row) => acc + (row.charge || 0), 0);
        const totalPayment = appendSelectedRows.reduce((acc, row) => acc + (row.payment || 0), 0);

        try {
            const res = await fetch(`/api/customers/ledger/${customerId}/saved-invoices/${appendingInvoiceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ records: appendSelectedRows, totalCharge, totalPayment })
            });
            if (res.ok) {
                toast.success("Items appended successfully!");
                setAppendingInvoiceId(null);
                setAppendSelectedRows([]);
                fetchInvoices();
                onInvoiceUpdated?.();
            } else {
                toast.error("Failed to append items");
            }
        } catch {
            toast.error("Server error");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#111111]"
                        style={{ opacity: 1 - i * 0.25 }}
                    >
                        <div className="px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-[#0d0d0d]">
                            <div className="space-y-2 flex-1">
                                <div className="mn-skeleton h-4 w-52 rounded-md" />
                                <div className="mn-skeleton h-3 w-72 rounded-md" />
                                <div className="mn-skeleton h-3 w-28 rounded-md" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="mn-skeleton h-12 w-20 rounded-lg" />
                                <div className="mn-skeleton h-12 w-20 rounded-lg" />
                                <div className="mn-skeleton h-12 w-20 rounded-lg" />
                                <div className="mn-skeleton h-9 w-9 rounded-lg" />
                                <div className="mn-skeleton h-9 w-9 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {invoices.length === 0 ? (
                <div className="text-center py-20">
                    <div className="inline-flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-inner border border-gray-200 dark:border-gray-700">
                            <Receipt className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                No Saved Invoices
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                Save selected ledger rows to generate an invoice
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                invoices.map((inv) => {
                    const isExpanded = expandedId === inv._id;
                    const netDue = (inv.totalCharge || 0) - (inv.totalPayment || 0);
                    const isDue = netDue > 0;

                    return (
                        <div
                            key={inv._id}
                            className={`border rounded-xl overflow-hidden transition-all duration-200 print:border-none print:block ${
                                isExpanded
                                    ? "border-indigo-300 dark:border-indigo-600/40 shadow-md shadow-indigo-100/60 dark:shadow-indigo-900/20"
                                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm"
                            } ${!isExpanded && "print:hidden"}`}
                        >
                            {/* ── Invoice Header ────────────────────────────────── */}
                            <div
                                className={`px-5 py-4 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors print:hidden ${
                                    isExpanded
                                        ? "bg-indigo-50/60 dark:bg-indigo-950/20"
                                        : "bg-gray-50 dark:bg-[#0d0d0d] hover:bg-gray-100/70 dark:hover:bg-[#161616]"
                                }`}
                                onClick={() => setExpandedId(isExpanded ? null : inv._id)}
                            >
                                {/* Left: Invoice Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <FileText size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                                        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
                                            {inv.invoiceNumber} — {inv.title}
                                        </h3>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                            isDue
                                                ? "bg-red-50 text-red-600 border-red-200/60 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                                        }`}>
                                            {isDue ? "DUE" : "CLEAR"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{inv.companyName}</span>
                                        {inv.orderIds?.length > 0 && (
                                            <span className="text-gray-400 dark:text-gray-600"> · Orders: {inv.orderIds.join(", ")}</span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider font-medium">
                                        {fmtDate(inv.createdAt)}
                                    </p>
                                </div>

                                {/* Right: Amounts + Actions */}
                                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                    {/* Billed */}
                                    <div className="text-right bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 min-w-[72px]">
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider mb-0.5">Billed</p>
                                        <p className="text-[13px] font-black text-gray-900 dark:text-gray-100 tabular-nums">৳{inv.totalCharge?.toLocaleString()}</p>
                                    </div>
                                    {/* Paid */}
                                    <div className="text-right bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 min-w-[72px]">
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider mb-0.5">Paid</p>
                                        <p className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">৳{inv.totalPayment?.toLocaleString()}</p>
                                    </div>
                                    {/* Due */}
                                    <div className={`text-right rounded-lg px-3 py-2 min-w-[72px] border ${
                                        isDue
                                            ? "bg-red-50 border-red-200/60 dark:bg-red-950/30 dark:border-red-900/50"
                                            : "bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                                    }`}>
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider mb-0.5">Net Due</p>
                                        <p className={`text-[13px] font-black tabular-nums ${
                                            isDue ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                                        }`}>৳{netDue.toLocaleString()}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-gray-700 pl-3 ml-1">
                                        {selectedView === "current" && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAppendingInvoiceId(inv._id);
                                                    setAppendSelectedRows([]);
                                                }}
                                                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 transition-colors border border-emerald-200/60 dark:border-emerald-900/50"
                                                title="Add Available Data to this Invoice"
                                            >
                                                <Plus size={13} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePrint(inv);
                                            }}
                                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 transition-colors border border-blue-200/60 dark:border-blue-900/50 print:hidden"
                                            title="Print Invoice"
                                        >
                                            <Printer size={13} />
                                        </button>
                                        <div className="text-gray-400 dark:text-gray-500 pl-1">
                                            {isExpanded
                                                ? <ChevronUp size={16} />
                                                : <ChevronDown size={16} />
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Print Only Header */}
                            <div className="hidden print:block p-6 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-2xl font-black mb-2">{inv.title || "Invoice"}</h2>
                                <p className="font-bold text-gray-800 dark:text-gray-200">Invoice No: {inv.invoiceNumber}</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">Company: {inv.companyName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Date: {fmtDate(inv.createdAt)}</p>
                            </div>

                            {/* ── Expanded Content ─────────────────────────────── */}
                            <div className={`${isExpanded ? "block" : "hidden"} print:block bg-white dark:bg-[#111111]`}>
                                <div className="overflow-x-auto w-full border-t border-gray-200 dark:border-gray-800">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/50">
                                        <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                            <tr>
                                                {[
                                                    { label: "Date", right: false },
                                                    { label: "Order ID", right: false },
                                                    { label: "Company", right: false },
                                                    { label: "Method", right: false },
                                                    { label: "Description", right: false },
                                                    { label: "Charge (+)", right: true },
                                                    { label: "Payment (−)", right: true },
                                                ].map((h) => (
                                                    <th
                                                        key={h.label}
                                                        className={`px-4 py-3 font-black text-gray-400 dark:text-gray-500 uppercase text-[10px] tracking-widest border-b border-gray-200 dark:border-gray-800 ${h.right ? "text-right" : "text-left"}`}
                                                    >
                                                        {h.label}
                                                    </th>
                                                ))}
                                                {selectedView === "current" && (
                                                    <th className="px-4 py-3 font-black text-gray-400 dark:text-gray-500 uppercase text-[10px] tracking-widest text-right border-b border-gray-200 dark:border-gray-800 print:hidden">
                                                        Action
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                                            {inv.records.map((row, idx) => (
                                                <tr key={idx} className={`transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-[#111111]" : "bg-gray-50/50 dark:bg-[#0e0e0e]"} hover:bg-blue-50/30 dark:hover:bg-blue-950/10`}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-[11px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                                                        {fmtDate(row.date)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                                        {row.displayOrderId || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-[11px] font-semibold text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                                                        {row.companyName || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                            row.type === "credit"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                                                                : row.provider === "BILLING"
                                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50"
                                                                : "bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-800/70 dark:text-slate-400 dark:border-slate-700/50"
                                                        }`}>
                                                            {row.provider}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-[12px]">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{row.description}</div>
                                                        {row.colour && (
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none">
                                                                {row.colour}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        {row.charge > 0 ? (
                                                            <div className="text-gray-900 dark:text-gray-100 font-bold text-[11px] tabular-nums">
                                                                ({row.qty} × {row.price}) = ৳{row.charge.toLocaleString()}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 dark:text-gray-700">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-black text-[12px] whitespace-nowrap tabular-nums">
                                                        {row.payment > 0 ? `৳${row.payment.toLocaleString()}` : (
                                                            <span className="text-gray-300 dark:text-gray-700">—</span>
                                                        )}
                                                    </td>
                                                    {selectedView === "current" && (
                                                        <td className="px-4 py-3 text-right print:hidden whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleRemoveRecord(inv._id, row)}
                                                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 p-1.5 rounded-lg transition-colors border border-red-200/60 dark:border-red-900/50"
                                                                title="Remove item"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-t-2 border-gray-200 dark:border-gray-800">
                                                <td colSpan={5} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                                    Totals
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-gray-100 text-[13px] tabular-nums">
                                                    ৳{inv.totalCharge?.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-[13px] tabular-nums">
                                                    ৳{inv.totalPayment?.toLocaleString()}
                                                </td>
                                                {selectedView === "current" && <td className="print:hidden" />}
                                            </tr>
                                            <tr className="bg-white dark:bg-[#111111]">
                                                <td colSpan={5} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                                    Net Due
                                                </td>
                                                <td colSpan={2} className={`px-4 py-3 text-right font-black text-[14px] tracking-tight tabular-nums ${
                                                    netDue > 0 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
                                                }`}>
                                                    ৳{netDue.toLocaleString()}
                                                </td>
                                                {selectedView === "current" && <td className="print:hidden" />}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* ── Append Modal ─────────────────────────────────────────────── */}
            {appendingInvoiceId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAppendingInvoiceId(null)} />
                    <div className="relative bg-white dark:bg-[#111111] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800 z-10">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-gray-50 dark:bg-[#0a0a0a] rounded-t-2xl">
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-gray-100 text-base">Append Data to Invoice</h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                    Select items from the Current Ledger to add them to this invoice.
                                </p>
                            </div>
                            <button
                                onClick={() => setAppendingInvoiceId(null)}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1">
                            {(!availableRows || availableRows.length === 0) ? (
                                <div className="text-center py-20">
                                    <div className="inline-flex flex-col items-center gap-3">
                                        <span className="text-4xl">📭</span>
                                        <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            No Available Items
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                            No unsaved items in the Current Ledger to append.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/50 text-left">
                                    <thead className="bg-gray-50 dark:bg-[#0d0d0d] sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 w-12">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111111] text-indigo-600 dark:text-indigo-500 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer w-3.5 h-3.5"
                                                    checked={appendSelectedRows.length === availableRows.length && availableRows.length > 0}
                                                    onChange={e => {
                                                        if (e.target.checked) setAppendSelectedRows([...availableRows]);
                                                        else setAppendSelectedRows([]);
                                                    }}
                                                />
                                            </th>
                                            {["Date", "Description", "Charge", "Payment"].map((h, i) => (
                                                <th key={h} className={`px-4 py-3 font-black text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-widest ${i >= 2 ? "text-right" : "text-left"}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                                        {availableRows.map((row, idx) => {
                                            const isSelected = appendSelectedRows.some(r => r.recordId === row.recordId && r.modelType === row.modelType);
                                            return (
                                                <tr
                                                    key={idx}
                                                    className={`cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/60 dark:bg-indigo-950/20" : idx % 2 === 0 ? "bg-white dark:bg-[#111111] hover:bg-blue-50/30 dark:hover:bg-blue-950/10" : "bg-gray-50/50 dark:bg-[#0e0e0e] hover:bg-blue-50/30 dark:hover:bg-blue-950/10"}`}
                                                    onClick={() => {
                                                        if (isSelected) setAppendSelectedRows(appendSelectedRows.filter(r => !(r.recordId === row.recordId && r.modelType === row.modelType)));
                                                        else setAppendSelectedRows([...appendSelectedRows, row]);
                                                    }}
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => { }}
                                                            className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111111] text-indigo-600 dark:text-indigo-500 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer w-3.5 h-3.5"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-[11px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">{fmtDate(row.date)}</td>
                                                    <td className="px-4 py-3 text-[12px]">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{row.description}</div>
                                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{row.companyName} · {row.provider}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-[12px] font-bold whitespace-nowrap text-gray-900 dark:text-gray-100 tabular-nums">{row.charge > 0 ? `৳${row.charge.toLocaleString()}` : "—"}</td>
                                                    <td className="px-4 py-3 text-right text-[12px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">{row.payment > 0 ? `৳${row.payment.toLocaleString()}` : "—"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] flex justify-between items-center rounded-b-2xl">
                            <div className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {appendSelectedRows.length} item{appendSelectedRows.length !== 1 ? "s" : ""} selected
                            </div>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => setAppendingInvoiceId(null)}
                                    className="px-4 py-2 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!appendSelectedRows.length || actionLoading}
                                    onClick={handleAppend}
                                    className="px-5 py-2 text-[11px] font-black text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer border border-indigo-700 dark:border-indigo-600"
                                >
                                    {actionLoading ? "Appending..." : "Confirm Append"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
                <div ref={printRef}>
                    <SavedInvoicePrint invoice={printingInvoice} companyAddress={companyAddress} />
                </div>
            </div>
        </div>
    );
}

export default React.memo(CustomerSavedBillsTab);
