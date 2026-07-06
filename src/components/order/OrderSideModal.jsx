"use client";
import React, { useRef, useState, useEffect } from "react";
import { X, Pencil, Printer, Trash2, Grid2x2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import OrderStatus from "../OrderStatus/OrderStatus";
import OrderInvoicePrint from "../Print/OrderInvoicePrint/OrderInvoicePrint";

const OrderSideModal = ({
  isModalOpen,
  loadingOrder,
  selectedOrder,
  closeModal,
  confirmDelete,
  setOrders,
  setSelectedOrder,
}) => {
  const router = useRouter();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [hasBatch, setHasBatch] = useState(false);

  useEffect(() => {
    if (selectedOrder?._id) {
      fetch(`/api/batch/${selectedOrder._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setHasBatch(true);
          else if (data && data.batches && data.batches.length > 0) setHasBatch(true);
          else setHasBatch(false);
        })
        .catch(() => setHasBatch(false));
    }
  }, [selectedOrder]);

  const formatDate = (dateString) => {
    if (!isClient || !dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const handlePrint = () => {
    const printArea = printRef.current.cloneNode(true);
    const tempDiv = document.createElement("div");
    tempDiv.className = "print-only";
    tempDiv.appendChild(printArea);
    document.body.appendChild(tempDiv);
    window.print();
    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 500);
  };

  // Detail rows configuration
  const detailRows = [
    { label: "Created At",           value: formatDate(selectedOrder?.createdAt) },
    { label: "Invoice No.",          value: selectedOrder?.invoiceNumber || "—" },
    { label: "Cloth Code / Quality", value: selectedOrder?.quality || "—" },
    { label: "Colour",               value: selectedOrder?.colour || "—" },
    { label: "Sill Name",            value: selectedOrder?.sillName || "—" },
    { label: "Finishing Type",       value: selectedOrder?.finishingType || "—" },
    { label: "Dyeing",               value: selectedOrder?.dyeingName || "—" },
    { label: "Transporter",          value: selectedOrder?.transporterName || "—" },
  ];

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="no-print fixed inset-0 flex justify-end z-50">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(28,39,76,0.25)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          />

          {/* Drawer panel */}
          <motion.div
            className="relative flex flex-col"
            style={{
              width: "100%",
              maxWidth: 440,
              height: "100%",
              backgroundColor: "#ffffff",
              borderLeft: "1px solid var(--mn-surface)",
              boxShadow: "-4px 0 32px rgba(28,39,76,0.15)",
              fontFamily: "var(--mn-font-primary)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {/* ── Header — Figma accent bg ── */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                backgroundColor: "var(--mn-accent)",
                padding: "16px 20px",
                minHeight: "64px",
              }}
            >
              <div>
                <p className="text-white text-[11px] font-medium opacity-60 uppercase tracking-widest mb-0.5">
                  Order Details
                </p>
                <h2 className="text-white text-[15px] font-bold leading-tight">
                  {selectedOrder?.orderId || selectedOrder?._id?.slice(-10) || "N/A"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="flex items-center justify-center transition-all cursor-pointer"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--mn-radius-md)",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  border: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.22)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)")}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {loadingOrder ? (
                <div className="flex justify-center items-center h-full">
                  <div
                    className="w-10 h-10 rounded-full animate-spin"
                    style={{ border: "3px solid var(--mn-surface)", borderTopColor: "var(--mn-accent)" }}
                  />
                </div>
              ) : (
                <>
                  {/* ── Product Card ── */}
                  <div
                    className="cursor-pointer transition-all"
                    style={{
                      backgroundColor: "var(--mn-background-3)",
                      borderRadius: "var(--mn-radius-md)",
                      border: "1px solid var(--mn-surface)",
                      boxShadow: "var(--mn-elevation-1)",
                      padding: "12px 16px",
                    }}
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "var(--mn-radius-md)",
                            backgroundColor: "#ffffff",
                            border: "1px solid var(--mn-surface)",
                            boxShadow: "var(--mn-elevation-1)",
                          }}
                        >
                          <Grid2x2 size={18} style={{ color: "var(--mn-accent)" }} />
                        </div>
                        <div>
                          <p
                            className="text-[14px] font-semibold uppercase leading-tight"
                            style={{ color: "var(--mn-text-primary)" }}
                          >
                            {selectedOrder?.clotheType || "N/A"}
                          </p>
                          {selectedOrder?.quality && (
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--mn-text-tertiary)" }}>
                              # {selectedOrder.quality}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ color: "var(--mn-text-tertiary)" }}>
                        {isDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* ── Collapsible Details ── */}
                  <AnimatePresence initial={false}>
                    {isDetailsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "var(--mn-radius-md)",
                            border: "1px solid var(--mn-surface)",
                            boxShadow: "var(--mn-elevation-1)",
                            padding: "16px",
                            marginBottom: "4px",
                          }}
                        >
                          {/* Detail grid */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {detailRows.map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--mn-text-tertiary)" }}>
                                  {label}
                                </p>
                                <p className="text-[13px] font-semibold" style={{ color: "var(--mn-text-primary)" }}>
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Print action */}
                          <div style={{ borderTop: "1px solid var(--mn-surface)", paddingTop: "12px", marginTop: "16px" }}>
                            <button
                              onClick={handlePrint}
                              className="inline-flex items-center gap-2 text-white text-[13px] font-semibold transition-all cursor-pointer"
                              style={{
                                backgroundColor: "var(--mn-accent-3)",
                                borderRadius: "var(--mn-radius-md)",
                                padding: "8px 14px",
                                border: "none",
                                boxShadow: "var(--mn-elevation-1)",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <Printer size={14} />
                              Print Invoice
                            </button>
                            <div style={{ display: "none" }}>
                              <div ref={printRef}>
                                <OrderInvoicePrint order={selectedOrder} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Order Status Section ── */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "var(--mn-radius-md)",
                      border: "1px solid var(--mn-surface)",
                      boxShadow: "var(--mn-elevation-1)",
                      padding: "16px",
                    }}
                  >
                    <p
                      className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                      style={{ color: "var(--mn-text-tertiary)" }}
                    >
                      Order Status
                    </p>
                    <OrderStatus
                      selectedOrder={selectedOrder}
                      orderId={selectedOrder?._id}
                      currentStatus={selectedOrder?.status || "Pending"}
                      tableData={selectedOrder?.tableData || []}
                      onStatusChange={(newStatus) => {
                        if (selectedOrder) {
                          if (setSelectedOrder) {
                            setSelectedOrder({ ...selectedOrder, status: newStatus });
                          }
                          if (setOrders) {
                            setOrders((prev) =>
                              prev.map((order) =>
                                order._id === selectedOrder._id
                                  ? { ...order, status: newStatus }
                                  : order
                              )
                            );
                          }
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* ── Footer Action Buttons ── */}
            {!loadingOrder && (
              <div
                className="flex-shrink-0 flex gap-3"
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid var(--mn-surface)",
                  backgroundColor: "var(--mn-background-3)",
                }}
              >
                {/* Edit */}
                <button
                  disabled={hasBatch}
                  onClick={() => router.push(`/dashboard/order/update/${selectedOrder?._id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-[13px] font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: hasBatch ? "var(--mn-surface)" : "var(--mn-accent)",
                    color: hasBatch ? "var(--mn-text-tertiary)" : "#ffffff",
                    borderRadius: "var(--mn-radius-md)",
                    padding: "10px 16px",
                    border: "none",
                    cursor: hasBatch ? "not-allowed" : "pointer",
                    boxShadow: hasBatch ? "none" : "var(--mn-elevation-1)",
                  }}
                  onMouseEnter={(e) => { if (!hasBatch) e.currentTarget.style.backgroundColor = "var(--mn-accent-4)"; }}
                  onMouseLeave={(e) => { if (!hasBatch) e.currentTarget.style.backgroundColor = "var(--mn-accent)"; }}
                >
                  <Pencil size={14} />
                  Edit Order
                </button>

                {/* Delete */}
                <button
                  onClick={() => confirmDelete(selectedOrder?._id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-[13px] font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: "rgba(146,37,37,0.08)",
                    color: "var(--mn-accent-alt)",
                    borderRadius: "var(--mn-radius-md)",
                    padding: "10px 16px",
                    border: "1px solid rgba(146,37,37,0.18)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(146,37,37,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(146,37,37,0.08)")}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OrderSideModal;
