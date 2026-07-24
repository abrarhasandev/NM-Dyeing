// @ts-nocheck
"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";



import PrintBillingInvoice from "../Print/PrintBillingInvoice/PrintBillingInvoice";
import { Check, Eye, Printer, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BillingBatch({ orderId, fetchOrders }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>({});
  const printRef = useRef(null);
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);
  const [savedRows, setSavedRows] = useState({});

  // Price and total per invoice/type
  const [priceByInvoice, setPriceByInvoice] = useState({});
  // shape: { [invoiceNumber]: { client: "", dyeing: "", calender: "" } }

  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Fetch invoices and order info
  const fetchBillingData = async () => {
    try {
      setLoading(true);

      const [invoiceRes, orderRes] = await Promise.all([
        fetch(`/api/batch/invoice/billing/${orderId}`),
        fetch(`/api/order/${orderId}`),
      ]);

      const invoiceData = await invoiceRes.json();
      const orderData = await orderRes.json();

      if (invoiceRes.ok) {
        const mapped = invoiceData.invoices.map((inv) => ({
          ...inv,
          isExpanded: false,
        }));
        setInvoices(mapped);

        // Initialize priceByInvoice
        setPriceByInvoice((prev) => {
          const next = { ...prev };
          mapped.forEach((inv) => {
            const key = inv.invoiceNumber;
            if (!next[key]) {
              next[key] = {
                client: { price: "", total: "" },
                dyeing: { price: "", total: "" },
                calender: { price: "", total: "" },
              };
            }
          });
          return next;
        });
      }

      if (orderRes.ok) setOrderInfo(orderData);
    } catch (err) {
      console.error(err);
     
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Helpers
  const toNumber = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const sumIdx = (idx) =>
    Array.isArray(idx)
      ? idx.reduce((s, x) => s + toNumber(x), 0)
      : toNumber(idx);
  const sumExtras = (extraInputs) =>
    Array.isArray(extraInputs)
      ? extraInputs.reduce((s, x) => s + toNumber(x), 0)
      : 0;

  const getInvoiceTotals = (inv) => {
    let idxTotal = 0;
    let extrasTotal = 0;
    (inv?.batches || []).forEach((b) => {
      (b?.rows || []).forEach((r) => {
        idxTotal += sumIdx(r?.idx);
        extrasTotal += sumExtras(r?.extraInputs);
      });
    });
    const totalQty = idxTotal + extrasTotal;
    return { idxTotal, extrasTotal, totalQty };
  };

  const invoiceHasCalender = (inv) =>
    inv?.batches?.some((b) => b?.calender && b.calender.trim() !== "");

  // Expand / Collapse

  const toggleExpand = (invoiceNumber) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceNumber === invoiceNumber
          ? { ...inv, isExpanded: !inv.isExpanded }
          : inv
      )
    );
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoiceNumber) => {
    try {
      const res = await fetch(`/api/batch/invoice/delete/${invoiceNumber}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Invoice deleted!");
        setInvoices((prev) =>
          prev.filter((inv) => inv.invoiceNumber !== invoiceNumber)
        );
        setPriceByInvoice((prev) => {
          const next = { ...prev };
          delete next[invoiceNumber];
          return next;
        });
        if (fetchOrders) fetchOrders();
      } else toast.error(data.error || "Failed to delete invoice");
    } catch (err) {
      console.error(err);
      toast.error("Server error while deleting invoice");
    } finally {
      setInvoiceToDelete(null);
    }
  };

  // Print invoice
  const handlePrint = (invoice) => {
    if (!invoice) return;
    setSelectedInvoiceToPrint({ ...invoice, orderInfo });
  };

  useEffect(() => {
    if (!selectedInvoiceToPrint) return;
    
    // Give a tiny delay for React to render the component into printRef
    setTimeout(() => {
      if (!printRef.current) return;
      document.querySelectorAll(".temp-print-container").forEach((el) => el.remove());
      const printArea = printRef.current.cloneNode(true);
      const tempDiv = document.createElement("div");
      tempDiv.className = "temp-print-container print-only";
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
          tempDiv.remove();
          setSelectedInvoiceToPrint(null);
        }, 500);
      });
    }, 100);
  }, [selectedInvoiceToPrint]);

  useEffect(() => {
    if (!invoices?.length) return;

    invoices.forEach(async (inv) => {
      const res = await fetch(
        `/api/batch/billing/summary/${inv.invoiceNumber}`
      );
      const data = await res.json();

      setSavedRows((prev) => ({
        ...prev,
        [inv.invoiceNumber]: data,
      }));
    });
  }, [invoices]);

  // Billing logic (bidirectional)
  const handleBillingChange = (invoiceNumber, type, field, value, totalQty) => {
    if (Number(value) < 0) return;
    setPriceByInvoice((prev) => {
      const current = prev[invoiceNumber]?.[type] || { price: "", total: "" };
      let price = current.price;
      let total = current.total;

      if (field === "price") {
        price = value;
        total = totalQty > 0 ? (toNumber(value) * totalQty).toFixed(2) : "";
      } else if (field === "total") {
        total = value;
        price = totalQty > 0 ? (toNumber(value) / totalQty).toFixed(2) : "";
      }

      return {
        ...prev,
        [invoiceNumber]: {
          ...prev[invoiceNumber],
          [type]: { price, total },
        },
      };
    });
  };

  const handleSaveSummary = async (inv, r, billing) => {
    try {
      const batch = inv.batches[0];
      const { totalQty } = getInvoiceTotals(inv);

      const payload = {
        orderId: orderId,
        displayOrderId: orderInfo?.orderId || "",
        companyName: orderInfo?.companyName || "Unknown Company",
        invoiceNumber: inv.invoiceNumber,
        summaryType: r.key,
        price: Number(billing.price),
        total: Number(billing.total),
        totalQty: Number(totalQty),
        batchName: batch.batchName,

        clotheType: batch.clotheType || orderInfo?.clotheType || "",
        colour: batch.colour,
        quality: batch.quality || orderInfo?.quality || "",
        sillName: batch.sillName,
        finishingType: batch.finishingType,
        customerId: batch.customerId || orderInfo?.customerId?._id || orderInfo?.customerId || orderInfo?.customerMongoId || null,
        dyeing: batch.dyeing || orderInfo?.dyeingName || "",
        dyeingId: batch.dyeingId || orderInfo?.dyeingId?._id || orderInfo?.dyeingId || orderInfo?.dyeingMongoId || null,

        calender: batch.calender || orderInfo?.calender || "",
        calenderId: batch.calenderId || orderInfo?.calenderId || null,
      };

      const res = await fetch("/api/batch/billing/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success(`${r.label} billing saved`);

      // 🔒 Disable / hide input after save
      setSavedRows((prev) => ({
        ...prev,
        [inv.invoiceNumber]: {
          ...prev[inv.invoiceNumber],
          [r.key]: true,
        },
      }));
      if (fetchOrders) fetchOrders();
    } catch {
      toast.error("Failed to save billing");
    }
  };

  if (loading) return <p>Loading billing invoices...</p>;
  if (!invoices.length)
    return <p className="text-gray-500 dark:text-muted-foreground">No invoice billing data found.</p>;

  return (
    <div className="mt-6 space-y-6">
      {invoices?.map((inv) => {
        const { idxTotal, extrasTotal, totalQty } = getInvoiceTotals(inv);
        const hasCalender = invoiceHasCalender(inv);
        const summaryRows = [
          { label: "Client", key: "client" },
          { label: "Dyeing", key: "dyeing" },
          ...(hasCalender ? [{ label: "Calender", key: "calender" }] : []),
        ];

        // For merged rows UI
        const isMultiple = inv.batchCount > 1;
        const mergedRows = isMultiple
          ? inv.batches.flatMap((b) =>
            (b.rows || []).map((r) => ({
              ...r,
              batchName: b.batchName,
              sillName: b.sillName,
              colour: b.colour,
              finishingType: b.finishingType,
            }))
          )
          : [];

        return (
          <div
            key={inv.invoiceNumber}
            className="border rounded-lg shadow-sm border-gray-200 dark:border-border dark:bg-card overflow-hidden"
          >
            <div className="flex justify-between items-center bg-gray-100 dark:bg-muted px-4 py-3 no-print">
              <h4 className="font-medium text-gray-700 dark:text-foreground">
                Delivery Slip:{" "}
                <span className="text-blue-600 font-semibold">
                  {inv.invoiceNumber}
                </span>{" "}
                <span className="text-sm text-orange-500">
                  ({isMultiple ? "Merged" : "Single"})
                </span>
              </h4>
              <div className="flex items-center gap-3 text-gray-600 dark:text-muted-foreground">
                <Eye
                  className="cursor-pointer hover:text-blue-600"
                  onClick={() => toggleExpand(inv.invoiceNumber)}
                  title="View Details"
                />
                <Printer
                  className="cursor-pointer hover:text-green-600"
                  onClick={() => handlePrint(inv)}
                  title="Print Invoice"
                />
                <Trash2
                  className="cursor-pointer text-red-500 hover:text-red-600"
                  onClick={() => setInvoiceToDelete(inv.invoiceNumber)}
                  title="Delete Invoice"
                />
              </div>
            </div>

            <AnimatePresence>
              {inv.isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-card border-t border-gray-200 dark:border-border text-gray-900 dark:text-foreground overflow-hidden"
                >
                  <div className="p-4 overflow-x-auto">
                    {/* Batches table */}
                    {isMultiple ? (
                      <table className="w-full text-sm border border-gray-200 dark:border-border">
                        <thead className="bg-gray-100 dark:bg-muted">
                          <tr>
                            <th className="px-3 py-2 border dark:border-border">Batch</th>
                            <th className="px-3 py-2 border dark:border-border">Roll No</th>
                            <th className="px-3 py-2 border dark:border-border">Goj</th>
                            <th className="px-3 py-2 border dark:border-border">Index</th>
                            <th className="px-3 py-2 border dark:border-border">Extras</th>
                            <th className="px-3 py-2 border dark:border-border">Sill</th>
                            <th className="px-3 py-2 border dark:border-border">Colour</th>
                            <th className="px-3 py-2 border dark:border-border">Finishing</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mergedRows?.map((row, idx) => (
                            <tr key={idx} className="text-center">
                              <td className="px-3 py-2 border dark:border-border">
                                {row.batchName}
                              </td>
                              <td className="px-3 py-2 border dark:border-border">{row.rollNo}</td>
                              <td className="px-3 py-2 border dark:border-border">{row.goj}</td>
                              <td className="px-3 py-2 border dark:border-border">
                                {Array.isArray(row.idx)
                                  ? row.idx.join(", ")
                                  : row.idx || "-"}
                              </td>
                              <td className="px-3 py-2 border dark:border-border">
                                {row.extraInputs?.length
                                  ? row.extraInputs.join(", ")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2 border dark:border-border">
                                {row.sillName}
                              </td>
                              <td className="px-3 py-2 border dark:border-border">{row.colour}</td>
                              <td className="px-3 py-2 border dark:border-border">
                                {row.finishingType}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      inv.batches.map((b, bIdx) => (
                        <div key={bIdx} className="mb-4">
                          <h5 className="text-gray-700 dark:text-foreground font-medium mb-2">
                            {b.batchName}
                          </h5>
                          <table className="w-full text-sm border border-gray-200 dark:border-border">
                            <thead className="bg-gray-100 dark:bg-muted">
                              <tr>
                                <th className="px-3 py-2 border dark:border-border">Roll No</th>
                                <th className="px-3 py-2 border dark:border-border">Goj</th>
                                <th className="px-3 py-2 border dark:border-border">Index</th>
                                <th className="px-3 py-2 border dark:border-border">Extras</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.rows.map((r, rIdx) => (
                                <tr key={rIdx} className="text-center">
                                  <td className="px-3 py-2 border dark:border-border">
                                    {r.rollNo}
                                  </td>
                                  <td className="px-3 py-2 border dark:border-border">{r.goj}</td>
                                  <td className="px-3 py-2 border dark:border-border">
                                    {Array.isArray(r.idx)
                                      ? r.idx.join(", ")
                                      : r.idx || "-"}
                                  </td>
                                  <td className="px-3 py-2 border dark:border-border">
                                    {r.extraInputs?.length
                                      ? r.extraInputs.join(", ")
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}

                    {/* Billing Summary */}
                    <div className="mt-4">
                      <table className="w-full text-sm border border-gray-200 dark:border-border">
                        <tbody>
                          <tr className="bg-gray-50 dark:bg-muted">
                            <td
                              className="px-3 py-2 border dark:border-border font-medium text-gray-700 dark:text-foreground"
                              colSpan={6}
                            >
                              Index = {idxTotal} | Extras = {extrasTotal} |
                              Total Qty = {totalQty}
                            </td>
                          </tr>

                          {summaryRows?.map((r) => {
                            const billing = priceByInvoice?.[
                              inv.invoiceNumber
                            ]?.[r.key] || { price: "", total: "" };

                            const isSaved =
                              savedRows?.[inv.invoiceNumber]?.[r.key] === true;

                            return (
                              <tr key={r.key} className="text-center">
                                <td className="px-3 py-2 border dark:border-border text-left font-medium">
                                  {r.label}
                                </td>
                                <td className="px-3 py-2 border dark:border-border text-red-500 font-bold text-lg">
                                  ×
                                </td>

                                <td className="px-3 py-2 border dark:border-border">
                                  {!isSaved && (
                                    <input
                                      type="number"
                                      min="0"
                                      value={billing.price}
                                      onChange={(e) =>
                                        handleBillingChange(
                                          inv.invoiceNumber,
                                          r.key,
                                          "price",
                                          e.target.value,
                                          totalQty
                                        )
                                      }
                                      placeholder="Price"
                                      className="w-full max-w-[90px] mx-auto border dark:border-border dark:bg-background dark:text-foreground rounded px-3 py-2 text-center"
                                    />
                                  )}
                                </td>

                                <td className="px-3 py-2 border dark:border-border font-bold text-lg text-gray-600 dark:text-muted-foreground">
                                  =
                                </td>

                                <td className="px-3 py-2 border dark:border-border font-semibold text-gray-700 dark:text-foreground">
                                  {!isSaved && (
                                    <input
                                      type="number"
                                      min="0"
                                      value={billing.total}
                                      onChange={(e) =>
                                        handleBillingChange(
                                          inv.invoiceNumber,
                                          r.key,
                                          "total",
                                          e.target.value,
                                          totalQty
                                        )
                                      }
                                      placeholder="Total"
                                      className="w-full max-w-[120px] mx-auto border dark:border-border dark:bg-background dark:text-foreground rounded px-3 py-2 text-center"
                                    />
                                  )}
                                </td>
                                <td>
                                  <button
                                    disabled={isSaved}
                                    onClick={() =>
                                      handleSaveSummary(inv, r, billing)
                                    }
                                    className={`px-2 py-2 rounded m-1 ${isSaved
                                        ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                                        : "bg-green-400 hover:bg-green-500"
                                      }`}
                                  >
                                    <Check />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Hidden printable area */}
      <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
        <div ref={printRef}>
          {selectedInvoiceToPrint && (
            <PrintBillingInvoice order={selectedInvoiceToPrint} />
          )}
        </div>
      </div>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the delivery slip <b>{invoiceToDelete}</b>. 
              Additionally, any billing summary created from this delivery slip and the corresponding client ledger statement entries will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete)} className="bg-red-600 hover:bg-red-700 text-white">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
