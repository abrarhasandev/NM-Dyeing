"use client";
import React, { useRef, useState, useEffect } from "react";
import { IoClose, IoChevronDown, IoChevronUp } from "react-icons/io5";
import { toast } from "sonner";
import { FaPencilAlt, FaPrint } from "react-icons/fa";
import { LuTrash2 } from "react-icons/lu";
import { CiGrid41 } from "react-icons/ci";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import OrderStatus from "../OrderStatus/OrderStatus";
import OrderInvoicePrint from "../Print/OrderInvoicePrint/OrderInvoicePrint";

interface OrderSideModalProps {
  isModalOpen: boolean;
  loadingOrder: boolean;
  selectedOrder: any;
  closeModal: () => void;
  confirmDelete: (id: string) => void;
  setOrders?: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedOrder?: React.Dispatch<React.SetStateAction<any>>;
  fetchOrders?: () => void;
}

const OrderSideModal: React.FC<OrderSideModalProps> = ({
  isModalOpen,
  loadingOrder,
  selectedOrder,
  closeModal,
  confirmDelete,
  setOrders,
  setSelectedOrder,
  fetchOrders,
}) => {
  const router = useRouter();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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
          else if (data && data.batches && data.batches.length > 0)
            setHasBatch(true);
          else setHasBatch(false);
        })
        .catch(() => setHasBatch(false));
    }
  }, [selectedOrder]);

  const formatDate = (dateString: string) => {
    if (!isClient || !dateString) return "Loading...";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printArea = printRef.current.cloneNode(true) as HTMLElement;
    const tempDiv = document.createElement("div");
    tempDiv.className = "print-only";
    tempDiv.appendChild(printArea);
    document.body.appendChild(tempDiv);
    window.print();
    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 500);
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      position: "bottom-right",
      duration: 2000,
    });
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="no-print fixed inset-0 flex justify-end z-50">
          <motion.div
            className="absolute inset-0 bg-[#26251e]/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          />

          <motion.div
            className="relative w-full sm:w-[350px] md:w-[450px] h-full bg-[#f7f7f4] shadow-lg border-l border-[color-mix(in_oklab,#26251e_10%,transparent)] flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[color-mix(in_oklab,#26251e_10%,transparent)]">
              <h2 className="text-[16px] font-bold text-[#26251e]">
                Order Details
              </h2>
              <IoClose
                className="w-5 h-5 text-[#26251e]/40 hover:text-[#26251e] cursor-pointer transition-colors"
                onClick={closeModal}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingOrder ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#26251e]"></div>
                </div>
              ) : (
                <>
                  <div
                    className="p-4 bg-[#f2f1ed] border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-[8px] cursor-pointer transition-all hover:bg-[#ebeae5] relative group shadow-sm"
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top Row: Customer & Date/Slip */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#f7f7f4] border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-[6px] flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                            <CiGrid41 className="text-xl text-[#26251e]" />
                          </div>
                          <div className="flex flex-col">
                            <p 
                               className="text-[12px] font-bold text-[#26251e]/60 mb-0.5 cursor-pointer hover:text-[#26251e] transition-colors"
                               onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(selectedOrder?.orderId, "Order number");
                               }}
                               title="Copy Order Number"
                            >
                              {selectedOrder?.orderId || "N/A"}
                            </p>
                            <p 
                               className="text-[14px] font-bold text-[#26251e] leading-tight cursor-pointer hover:text-[#26251e]/80 transition-colors"
                               onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(selectedOrder?.companyName, "Customer name");
                               }}
                               title="Copy Customer Name"
                            >
                              {selectedOrder?.companyName || "Unknown Customer"}
                            </p>
                            <p className="text-[11px] font-semibold text-[#26251e]/60 mt-1 uppercase tracking-wider">
                              {selectedOrder?.clotheType || "N/A"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right flex flex-col items-end">
                          <p className="text-[13px] font-bold text-[#26251e] leading-tight">
                            #{selectedOrder?.invoiceNumber || "N/A"}
                          </p>
                          <p className="text-[11px] font-medium text-[#26251e]/60 mt-1">
                            {formatDate(selectedOrder?.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-[1px] w-full bg-[color-mix(in_oklab,#26251e_10%,transparent)]"></div>

                      {/* Bottom Row: Dyeing & Transporter */}
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <p className="text-[10px] font-semibold text-[#26251e]/50 uppercase tracking-wider mb-0.5">Dyeing</p>
                            <p className="text-[12px] font-medium text-[#26251e]">{selectedOrder?.dyeingName || "N/A"}</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] font-semibold text-[#26251e]/50 uppercase tracking-wider mb-0.5">Transporter</p>
                            <p className="text-[12px] font-medium text-[#26251e]">{selectedOrder?.transporterName || "N/A"}</p>
                          </div>
                        </div>
                        
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f7f7f4] border border-[color-mix(in_oklab,#26251e_10%,transparent)] text-[#26251e]/60 group-hover:text-[#26251e] transition-colors">
                          {isDetailsOpen ? <IoChevronUp size={14} /> : <IoChevronDown size={14} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isDetailsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-6 pt-2">
                          <div className="grid grid-cols-2 gap-4 text-[#26251e]">
                            <div>
                              <p className="text-[11px] font-medium text-[#26251e]/60">Quantity</p>
                              <p className="text-[13px] font-semibold">
                                {selectedOrder?.quality || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-[#26251e]/60">Colour</p>
                              <p className="text-[13px] font-semibold">
                                {selectedOrder?.colour || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-[#26251e]/60">Sill Name</p>
                              <p className="text-[13px] font-semibold">
                                {selectedOrder?.sillName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-[#26251e]/60">
                                Finishing Type
                              </p>
                              <p className="text-[13px] font-semibold">
                                {selectedOrder?.finishingType || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-[color-mix(in_oklab,#26251e_10%,transparent)] pt-4 flex gap-2">
                            <button
                              onClick={handlePrint}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#1f8a65] text-[#f7f7f4] rounded-[4px] hover:bg-[#1f8a65]/90 transition-colors cursor-pointer text-[12px] font-medium"
                            >
                              <FaPrint size={14} /> Print
                            </button>
                            <div style={{ display: "none" }}>
                              <div ref={printRef}>
                                <OrderInvoicePrint order={selectedOrder} />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[color-mix(in_oklab,#26251e_10%,transparent)] flex justify-between gap-4">
                            <button
                              disabled={hasBatch}
                              onClick={() =>
                                router.push(
                                  `/dashboard/order/update/${selectedOrder?._id}`
                                )
                              }
                              className={`flex-1 py-2.5 px-4 rounded-[6px] font-semibold text-[13px] transition-colors flex justify-center items-center gap-1.5 ${hasBatch
                                  ? "bg-[#e6e5e0] text-[#26251e]/40 cursor-not-allowed border border-[color-mix(in_oklab,#26251e_10%,transparent)]"
                                  : "bg-[#26251e] text-[#f7f7f4] hover:bg-[#3b3a33] cursor-pointer"
                                }`}
                            >
                              <FaPencilAlt size={12} /> Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(selectedOrder?._id)}
                              className="flex-1 py-2.5 px-4 bg-[#cf2d56]/10 text-[#cf2d56] rounded-[6px] font-semibold text-[13px] hover:bg-[#cf2d56]/20 border border-[#cf2d56]/20 transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                            >
                              <LuTrash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <OrderStatus
                    selectedOrder={selectedOrder}
                    orderId={selectedOrder?._id}
                    currentStatus={selectedOrder?.status || "Pending"}
                    tableData={selectedOrder?.tableData || []}
                    onStatusChange={(newStatus: string) => {
                      if (selectedOrder) {
                        if (setSelectedOrder) {
                          setSelectedOrder({
                            ...selectedOrder,
                            status: newStatus,
                          });
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
                    setOrders={setOrders}
                    setSelectedOrder={setSelectedOrder}
                    fetchOrders={fetchOrders}
                  />
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OrderSideModal;
