// @ts-nocheck
"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Truck, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import useAppData from "@/hook/useAppData";
import SearchableSelect from "../OrderCreate/SearchableSelect";

interface AddTransportOrderModalProps {
  open: boolean;
  onClose: () => void;
  transportEmployeeId: Id<"transportEmployees">;
  transporterName: string;
}

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  companyName: "",
  clotheType: "",
  quality: "",
  colour: "",
  finishingType: "",
  totalGoj: "",
  totalBundle: "",
  status: "pending",
  note: "",
  linkedOrderId: "",
};

/**
 * Manual transport order history form (Transport Management only).
 * Does not create a dyeing production order — Convex transportOrders only.
 */
export default function AddTransportOrderModal({
  open,
  onClose,
  transportEmployeeId,
  transporterName,
}: AddTransportOrderModalProps) {
  const { data } = useAppData();
  const createTransportOrder = useMutation(api.transportOrders.create);
  const customers = useQuery(api.customers.getAll) || [];
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const customerOptions = useMemo(() => {
    return customers.map((c) => ({
      value: c.companyName,
      label: c.companyName,
    }));
  }, [customers]);

  const statusOptions = useMemo(
    () => [
      { value: "pending", label: "Pending" },
      { value: "inprocess", label: "In Process" },
      { value: "delivered", label: "Delivered" },
      { value: "completed", label: "Completed" },
    ],
    []
  );

  const clotheTypeOptions = useMemo(() => {
    return (data?.clotheTypes || []).map((item: { _id?: string; name: string }) => ({
      value: item.name,
      label: item.name,
    }));
  }, [data?.clotheTypes]);

  const qualityOptions = useMemo(() => {
    return (data?.qualities || []).map((item: { _id?: string; name: string }) => ({
      value: item.name,
      label: item.name,
    }));
  }, [data?.qualities]);

  const colourOptions = useMemo(() => {
    return (data?.colours || []).map((item: { _id?: string; name: string }) => ({
      value: item.name,
      label: item.name,
    }));
  }, [data?.colours]);

  const finishingTypeOptions = useMemo(() => {
    return (data?.finishingTypes || []).map((item: { _id?: string; name: string }) => ({
      value: item.name,
      label: item.name,
    }));
  }, [data?.finishingTypes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { id: string; value: string } }
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const resetAndClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      toast.error("Company / customer name is required");
      return;
    }
    if (!form.date) {
      toast.error("Date is required");
      return;
    }

    setSubmitting(true);
    try {
      const dateMs = new Date(form.date + "T00:00:00.000Z").getTime();
      await createTransportOrder({
        transportEmployeeId,
        transporterName,
        companyName: form.companyName.trim(),
        clotheType: form.clotheType || undefined,
        quality: form.quality || undefined,
        colour: form.colour || undefined,
        finishingType: form.finishingType || undefined,
        totalGoj: form.totalGoj === "" ? undefined : Number(form.totalGoj),
        totalBundle: form.totalBundle === "" ? undefined : Number(form.totalBundle),
        status: form.status || "pending",
        date: dateMs,
        note: form.note || undefined,
        linkedOrderId: form.linkedOrderId || undefined,
      });
      toast.success("Transport order history added");
      setForm(emptyForm);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add transport order";
      toast.error(message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = "w-full px-4 py-3 rounded-lg text-[13px] bg-[#ebeae5] dark:bg-[#1f1f1f] border border-transparent focus:outline-none focus:border-[#26251e]/20 dark:focus:border-[#f7f7f4]/20 text-[#26251e] dark:text-[#f7f7f4] transition-all placeholder:text-[#26251e]/50 dark:placeholder:text-[#f7f7f4]/50";
  const labelBase = "text-[12px] font-medium text-[#26251e]/70 dark:text-[#f7f7f4]/70 mb-1.5 inline-block";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#050503]/60 backdrop-blur-sm"
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#f7f7f4] dark:bg-[#050503] rounded-2xl shadow-2xl border border-[#26251e]/10 dark:border-[#f7f7f4]/10 p-6 sm:p-8 font-sans"
            role="dialog"
            aria-labelledby="add-transport-order-title"
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f54e00]/10 flex items-center justify-center shrink-0">
                  <Truck size={22} className="text-[#f54e00]" />
                </div>
                <div>
                  <h3
                    id="add-transport-order-title"
                    className="text-[20px] font-semibold text-[#26251e] dark:text-[#f7f7f4] leading-snug tracking-tight"
                  >
                    Add Order
                  </h3>
                  <p className="text-[13px] text-[#26251e]/60 dark:text-[#f7f7f4]/60 mt-0.5">
                    Fill in the details for this transport trip
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="p-2 -mr-2 -mt-2 rounded-full text-[#26251e]/50 dark:text-[#f7f7f4]/50 hover:bg-[#26251e]/5 dark:hover:bg-[#f7f7f4]/10 hover:text-[#26251e] dark:hover:text-[#f7f7f4] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className={labelBase}>
                    Date *
                  </label>
                  <input
                    id="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={handleChange}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label htmlFor="status" className={labelBase}>
                    Status
                  </label>
                  <div className="w-full text-[13px]">
                    <SearchableSelect
                      id="status"
                      value={form.status}
                      onChange={handleChange}
                      options={statusOptions}
                      placeholder="Select status..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="companyName" className={labelBase}>
                  Company / Customer *
                </label>
                <div className="w-full text-[13px]">
                  <SearchableSelect
                    id="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    options={customerOptions}
                    placeholder="Search or select a customer..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clotheType" className={labelBase}>
                    Cloth Type
                  </label>
                  <div className="w-full text-[13px]">
                    <SearchableSelect
                      id="clotheType"
                      value={form.clotheType}
                      onChange={handleChange}
                      options={clotheTypeOptions}
                      placeholder="Select..."
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="quality" className={labelBase}>
                    Quality
                  </label>
                  <div className="w-full text-[13px]">
                    <SearchableSelect
                      id="quality"
                      value={form.quality}
                      onChange={handleChange}
                      options={qualityOptions}
                      placeholder="Select..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="colour" className={labelBase}>
                    Colour
                  </label>
                  <div className="w-full text-[13px]">
                    <SearchableSelect
                      id="colour"
                      value={form.colour}
                      onChange={handleChange}
                      options={colourOptions}
                      placeholder="Select..."
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="finishingType" className={labelBase}>
                    Finishing
                  </label>
                  <div className="w-full text-[13px]">
                    <SearchableSelect
                      id="finishingType"
                      value={form.finishingType}
                      onChange={handleChange}
                      options={finishingTypeOptions}
                      placeholder="Select..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="totalBundle" className={labelBase}>
                    Total Bundle
                  </label>
                  <input
                    id="totalBundle"
                    type="number"
                    min={0}
                    step="any"
                    value={form.totalBundle}
                    onChange={handleChange}
                    placeholder="e.g. 6"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label htmlFor="totalGoj" className={labelBase}>
                    Total Goj
                  </label>
                  <input
                    id="totalGoj"
                    type="number"
                    min={0}
                    step="any"
                    value={form.totalGoj}
                    onChange={handleChange}
                    placeholder="e.g. 1800"
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="linkedOrderId" className={labelBase}>
                  Linked system order ID (optional)
                </label>
                <input
                  id="linkedOrderId"
                  type="text"
                  value={form.linkedOrderId}
                  onChange={handleChange}
                  placeholder="#ord-… (reference only)"
                  className={`${inputBase} font-mono`}
                />
              </div>

              <div>
                <label htmlFor="note" className={labelBase}>
                  Note
                </label>
                <textarea
                  id="note"
                  rows={2}
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Optional notes about this trip / load"
                  className={`${inputBase} resize-none`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg font-medium text-[14px] text-[#26251e] dark:text-[#f7f7f4] bg-transparent hover:bg-[#26251e]/5 dark:hover:bg-[#f7f7f4]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-[14px] text-white bg-[#f54e00] hover:bg-[#c43e00] shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:hover:shadow-md"
                >
                  <Plus size={16} />
                  {submitting ? "Saving…" : "Add Order"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
