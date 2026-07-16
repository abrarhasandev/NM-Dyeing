// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";

import { toast } from "sonner";
import PrintBillingInvoice from "../Print/PrintBillingInvoice/PrintBillingInvoice";
import { Pencil, Printer, Save, Search, X } from "lucide-react";

const CompletedBatch = ({ orderId, fetchOrders }) => {
  const [summaries, setSummaries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [orderInfo, setOrderInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ price: "", total: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const printRef = useRef(null);
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);

  
  const BILLING_CATEGORIES = ["client", "dyeing", "calender"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, invRes, ordRes] = await Promise.all([
          fetch(`/api/batch/completed/billing-summary/${orderId}`),
          fetch(`/api/batch/invoice/billing/${orderId}`),
          fetch(`/api/order/${orderId}`)
        ]);
        
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummaries(sumData.data || []);
        }
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvoices(invData.invoices || []);
        }
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrderInfo(ordData || {});
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchData();
  }, [orderId]);

  const handlePrint = (invoiceNumber) => {
    const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
        toast.error("Invoice details not found! Please ensure it wasn't deleted.");
        return;
    }
    setSelectedInvoiceToPrint({ ...invoice, orderInfo });
  };

  useEffect(() => {
    if (!selectedInvoiceToPrint) return;
    
    setTimeout(() => {
      if (!printRef.current) return;
      const printArea = printRef.current.cloneNode(true);
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.top = "0";
      tempDiv.style.left = "0";
      tempDiv.style.width = "100%";
      tempDiv.style.background = "white";
      tempDiv.style.zIndex = "9999";
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
          setSelectedInvoiceToPrint(null);
        }, 500);
      });
    }, 100);
  }, [selectedInvoiceToPrint]);

 
  const processedData = useMemo(() => {

    const filtered = summaries?.filter((item) => {
      if (!searchTerm) return true;
      return item.invoiceNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });

  
    return filtered?.reduce((acc, item) => {
      if (!acc[item.summaryType]) acc[item.summaryType] = [];
      acc[item.summaryType].push(item);
      return acc;
    }, {});
  }, [summaries, searchTerm]);

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditValues({ price: item.price, total: item.total });
  };

  const handleSave = async (id) => {
    try {
      const res = await fetch(`/api/batch/completed/update-billing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) throw new Error();
      setSummaries((prev) =>
        prev?.map((item) => (item._id === id ? { ...item, ...editValues } : item))
      );
      setEditingId(null);
      toast.success("Billing updated");
      if (fetchOrders) fetchOrders();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-background min-h-screen">
      {/* search section*/}
      <div className="p-4 bg-white dark:bg-card border-b dark:border-border sticky top-0 z-10 shadow-sm">
        <h1 className="text-md font-bold text-gray-700 dark:text-foreground mb-3">Client Billing</h1>
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="text-gray-400 dark:text-muted-foreground" size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by Invoice ID..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-muted border border-transparent rounded-lg text-sm text-gray-900 dark:text-foreground focus:bg-white dark:focus:bg-background focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <p className="text-center text-sm py-10 text-gray-500 dark:text-muted-foreground">Loading...</p>
        ) : (
          //service sequience wise loop 
          BILLING_CATEGORIES.map((type) => {
            const items = processedData?.[type] || [];
            return (
              <div key={type} className="mb-6">
                <h2 className="text-[11px] font-black uppercase text-gray-500 dark:text-muted-foreground mb-3 border-l-4 border-blue-500 pl-2 tracking-wider">
                  {type} Billing
                </h2>

                <div className="space-y-3">
                  {items?.length > 0 ? (
                    items?.map((item) => (
                      <div key={item._id} className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-2 shadow-sm">
                        {/* Batch Info Card */}
                        <div className="bg-gray-100 dark:bg-muted p-2 rounded-lg mb-2 border border-gray-200 dark:border-border">
                          <p className="text-[13px] font-bold text-gray-800 dark:text-foreground leading-tight uppercase">
                            {item?.batchName} • {item?.colour} • {item?.finishingType} • 
                            <span className="text-blue-600 ml-1">{item?.invoiceNumber}</span>
                          </p>
                        </div>

                        {/* Calculation Area */}
                        <div className="flex items-center justify-between gap-1">
                          {/* Qty */}
                          <div className="flex-1 bg-gray-50 dark:bg-muted rounded-lg py-1 text-center border border-gray-200 dark:border-border">
                            <p className="text-[10px] text-gray-500 dark:text-muted-foreground font-bold">Goj</p>
                            <p className="text-xs font-black text-gray-900 dark:text-foreground">{item.totalQty}</p>
                          </div>

                          <span className="text-red-400 font-bold text-xs">×</span>

                          {/* Price Input/Text */}
                          <div className={`flex-1 rounded-lg py-1 text-center border ${editingId === item._id ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-border bg-gray-50 dark:bg-muted'}`}>
                            <p className="text-[10px] text-gray-500 dark:text-muted-foreground font-bold uppercase">Price</p>
                            {editingId === item._id ? (
                              <input
                                type="number"
                                className="w-full bg-transparent text-center font-bold text-xs text-gray-900 dark:text-foreground outline-none"
                                value={editValues.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newPrice = parseFloat(val);
                                  const total = isNaN(newPrice) ? "" : (newPrice * item.totalQty).toFixed(1);
                                  setEditValues({ ...editValues, price: val, total });
                                }}
                              />
                            ) : (
                              <p className="text-xs font-black text-gray-900 dark:text-foreground">৳{item.price || "0"}</p>
                            )}
                          </div>

                          <div className="flex flex-col gap-[2px]">
                            <div className="w-3 h-[1.5px] bg-gray-400 dark:bg-gray-600"></div>
                            <div className="w-3 h-[1.5px] bg-gray-400 dark:bg-gray-600"></div>
                          </div>

                          {/* Total Input/Text */}
                          <div className={`flex-1 rounded-lg py-1 text-center border ${editingId === item._id ? 'border-blue-400 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-border bg-gray-50 dark:bg-muted'}`}>
                            <p className="text-[10px] text-gray-500 dark:text-muted-foreground font-bold uppercase">Total</p>
                            {editingId === item._id ? (
                              <input
                                type="number"
                                className="w-full bg-transparent text-center font-bold text-xs text-gray-900 dark:text-foreground outline-none"
                                value={editValues.total}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newTotal = parseFloat(val);
                                  const price = (isNaN(newTotal) || !item.totalQty) ? "" : (newTotal / item.totalQty).toFixed(1);
                                  setEditValues({ ...editValues, total: val, price });
                                }}
                              />
                            ) : (
                              <p className="text-xs font-black text-gray-700 dark:text-foreground">৳{item.total || "0"}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 pl-1">
                            <button
                              onClick={() => handlePrint(item.invoiceNumber)}
                              className="p-2 rounded-lg border bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 transition-all hover:bg-blue-200 dark:hover:bg-blue-800/60"
                              title="Print Delivery Slip"
                            >
                              <Printer size={12} />
                            </button>
                            <button
                              onClick={() => (editingId === item._id ? handleSave(item._id) : handleEdit(item))}
                              className={`p-2 rounded-lg border transition-all ${
                                editingId === item._id ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                              }`}
                            >
                              {editingId === item._id ? <Save size={12} /> : <Pencil size={12} />}
                            </button>
                            {editingId === item._id && (
                              <button onClick={() => setEditingId(null)} className="p-2 bg-gray-200 dark:bg-muted rounded-lg text-gray-600 dark:text-muted-foreground">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center border border-dashed border-gray-300 dark:border-border rounded-xl bg-gray-50/50 dark:bg-muted/20">
                      <p className="text-[10px] text-gray-400 dark:text-muted-foreground italic">No {type} records found.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
        <div ref={printRef} className="print-only">
          {selectedInvoiceToPrint && (
            <PrintBillingInvoice order={selectedInvoiceToPrint} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedBatch;