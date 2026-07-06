"use client";
import React, { useState } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  MoreVertical,
  AlertCircle,
  Trash2,
  Truck,
  TrendingDown,
  FileText,
  ChevronsUpDown,
  X,
} from "lucide-react";

// ─── Dummy data pools ────────────────────────────────────────────────────────
const DUMMY_CLOTH_TYPES = ["পলিষ্টার", "লোন", "কটন", "সিল্ক", "টিসি", "ভিসকস", "লিনেন", "জর্জেট"];
const DUMMY_QUALITIES = ["ষ্টাইপ", "1200", "1800", "1400", "1600", "1000", "1500", "1100"];
const DUMMY_STATUSES = ["pending", "inprocess", "done", "completed", "inprocess", "completed", "inprocess", "inprocess"];
const DUMMY_GOJ_VALUES = [18625, 18625, 18625, 18625, 26525, 18625, 18625, 18625];

// Simple hash-based selector for consistent dummy values per order
const getDummyIndex = (id, poolLength) => {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % poolLength;
};

// ─── Status Badges — exact Figma match ───────────────────────────────────────
const renderStatusBadges = (status, orderId) => {
  const s = status?.toLowerCase() || "pending";

  // pending
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A] select-none">
        <Clock size={10} className="shrink-0 text-[#A1A1AA]" />
        pending
      </span>
    );
  }

  // in process → shows "in process" + "Delivered (n)"
  if (s === "inprocess" || s === "in process" || s === "processing") {
    const deliveryNum = getDummyIndex(orderId + "del", 3) + 1;
    return (
      <div className="flex flex-col gap-1 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A]">
          <Clock size={10} className="shrink-0 text-[#A1A1AA]" />
          in process
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A]">
          <Truck size={10} className="shrink-0 text-[#A1A1AA]" />
          Delivered
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            {deliveryNum}
          </span>
        </span>
      </div>
    );
  }

  // done
  if (s === "done") {
    return (
      <div className="flex flex-col gap-1 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A]">
          <CheckCircle2 size={10} className="shrink-0 text-[#A1A1AA]" />
          Done
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A]">
          <Truck size={10} className="shrink-0 text-[#A1A1AA]" />
          Delivered
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            3
          </span>
        </span>
      </div>
    );
  }

  // complete / completed / delivered / completedprocess
  if (["completed", "delivered", "completedprocess", "complete"].includes(s)) {
    return (
      <div className="flex flex-col gap-1 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A]">
          <CheckCircle2 size={10} className="shrink-0 text-[#A1A1AA]" />
          complete
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A]">
          <Truck size={10} className="shrink-0 text-[#A1A1AA]" />
          Delivered
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            3
          </span>
        </span>
      </div>
    );
  }

  // batch
  if (s === "batch") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A] select-none">
        <Clock size={10} className="shrink-0 text-[#A1A1AA]" />
        Batching
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A] select-none">
      <Clock size={10} className="shrink-0 text-[#A1A1AA]" />
      {s}
    </span>
  );
};

// ─── Total Goj — exact Figma match ───────────────────────────────────────────
// Figma shows: main value (e.g. "Gry 53~18625"), then sub-rows:
//   Red  ✗  badge  = pending/unprocessed batches
//   Blue  ↺  badge = active/in-process batches  
//   Green ✓  badge = completed batches with loss% pill
const renderGojDetails = (orderId, totalGojVal) => {
  const index = getDummyIndex(orderId + "goj_v2", 7);

  // Pattern definitions matching Figma designs
  const patterns = [
    // 0 – simple (pending order, no sub-rows)
    { rows: [] },
    // 1 – in process, 1 pending batch
    {
      rows: [
        { icon: "x",     text: "7~1525",       cls: "text-[#EF4444] bg-[#FEF2F2] border-[#FECACA]" },
        { icon: "clock", text: "3/ 39~2602",   cls: "text-[#71717A] bg-white border-[#D4D4D8]" },
      ],
    },
    // 2 – in process, pending + active + completed
    {
      rows: [
        { icon: "x",     text: "7~1525",       cls: "text-[#EF4444] bg-[#FEF2F2] border-[#FECACA]" },
        { icon: "clock", text: "4/ 39~12525",  cls: "text-[#71717A] bg-white border-[#D4D4D8]" },
        { icon: "check", text: "2/ 24~4337",   cls: "text-[#22C55E] bg-[#F0FDF4] border-[#BBF7D0]", trend: "-5.2%" },
      ],
    },
    // 3 – active + completed
    {
      rows: [
        { icon: "clock", text: "3/ 32~12525",  cls: "text-[#71717A] bg-white border-[#D4D4D8]" },
        { icon: "check", text: "4/ 37~8560",   cls: "text-[#22C55E] bg-[#F0FDF4] border-[#BBF7D0]", trend: "-6.2%" },
      ],
    },
    // 4 – fully completed
    {
      rows: [
        { icon: "check", text: "7/ 59~16256",  cls: "text-[#22C55E] bg-[#F0FDF4] border-[#BBF7D0]", trend: "-5.9%" },
      ],
    },
    // 5 – in process with 3 sub-rows
    {
      rows: [
        { icon: "x",     text: "7~1525",       cls: "text-[#EF4444] bg-[#FEF2F2] border-[#FECACA]" },
        { icon: "clock", text: "3/ 52~12525",  cls: "text-[#71717A] bg-white border-[#D4D4D8]" },
        { icon: "check", text: "2/ 24~10255",  cls: "text-[#22C55E] bg-[#F0FDF4] border-[#BBF7D0]", trend: "-17.5%" },
      ],
    },
    // 6 – all completed (for complete/done orders)
    {
      rows: [
        { icon: "check", text: "7/ 59~16256",  cls: "text-[#22C55E] bg-[#F0FDF4] border-[#BBF7D0]", trend: "-5.9%" },
      ],
    },
  ];

  const { rows } = patterns[index];

  return (
    <div className="flex flex-col gap-1 py-0.5 select-none min-w-[120px]">
      <span className="font-semibold text-[#09090B] text-[13px] leading-tight">
        Gry {totalGojVal >= 80000 ? "83" : "53"}~{totalGojVal}
      </span>
      {rows.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {rows.map((rec, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-sm border text-[9px] font-semibold ${rec.cls}`}>
                {rec.icon === "x" && <X size={7} strokeWidth={3} className="shrink-0" />}
                {rec.icon === "clock" && <Clock size={7} className="shrink-0" />}
                {rec.icon === "check" && <CheckCircle2 size={7} className="shrink-0" />}
                <span>{rec.text}</span>
              </span>
              {rec.trend && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-sm border border-[#FECACA] bg-white text-[#EF4444] text-[9px] font-bold">
                  <TrendingDown size={7} className="shrink-0" />
                  <span className="text-[#09090B]">{rec.trend}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Billing Badges — exact Figma match ──────────────────────────────────────
// Figma shows 5 billing states:
//   pending  → clock pill
//   U/B (n)  → single underline-bill pill
//   U/B + Bill → two pills
//   Bill (n) → single billed pill (completed)
const renderBillingBadges = (order, orderId) => {
  const s = order?.status?.toLowerCase() || "pending";
  const isCompleted = ["completed", "delivered", "completedprocess", "complete"].includes(s);

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B] select-none">
        <FileText size={10} className="shrink-0 text-[#71717A]" />
        Bill
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          7
        </span>
      </span>
    );
  }

  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A] select-none">
        <Clock size={10} className="shrink-0 text-[#A1A1AA]" />
        pending
      </span>
    );
  }

  const index = getDummyIndex(orderId + "billing_v2", 4);

  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B] select-none">
        <FileText size={10} className="shrink-0 text-[#71717A]" />
        U/B
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          2
        </span>
      </span>
    );
  }

  if (index === 1) {
    const ubN = getDummyIndex(orderId + "ub", 4) + 2;
    const billN = getDummyIndex(orderId + "bl", 3);
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <FileText size={10} className="shrink-0 text-[#71717A]" />
          U/B
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            {ubN}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <FileText size={10} className="shrink-0 text-[#71717A]" />
          Bill
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            {billN}
          </span>
        </span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <FileText size={10} className="shrink-0 text-[#71717A]" />
          U/B
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            5
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <FileText size={10} className="shrink-0 text-[#71717A]" />
          Bill
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            2
          </span>
        </span>
      </div>
    );
  }

  // index === 3
  return (
    <div className="flex flex-col gap-0.5 select-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
        <FileText size={10} className="shrink-0 text-[#71717A]" />
        U/B
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          2
        </span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
        <FileText size={10} className="shrink-0 text-[#71717A]" />
        Bill
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          0
        </span>
      </span>
    </div>
  );
};

// ─── Inventory Badges — exact Figma match ────────────────────────────────────
// Figma shows:
//   pending  → clock pill
//   U/Trk (n) → single under-truck pill
//   U/Trk + Trk → two pills stacked
//   Trk (n)  → single truck pill (completed)
const renderInventoryBadges = (order, orderId) => {
  const s = order?.status?.toLowerCase() || "pending";
  const isCompleted = ["completed", "delivered", "completedprocess", "complete"].includes(s);

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B] select-none">
        <Truck size={10} className="shrink-0 text-[#71717A]" />
        Trk
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          7
        </span>
      </span>
    );
  }

  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#E4E4E7] bg-white text-[#71717A] select-none">
        <Clock size={10} className="shrink-0 text-[#A1A1AA]" />
        pending
      </span>
    );
  }

  const index = getDummyIndex(orderId + "inv_v2", 4);

  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B] select-none">
        <Truck size={10} className="shrink-0 text-[#71717A]" />
        U/Trk
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          2
        </span>
      </span>
    );
  }

  if (index === 1) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <Truck size={10} className="shrink-0 text-[#71717A]" />
          U/Trk
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            3
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <Truck size={10} className="shrink-0 text-[#71717A]" />
          Trk
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            1
          </span>
        </span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <Truck size={10} className="shrink-0 text-[#71717A]" />
          U/Trk
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            4
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
          <Truck size={10} className="shrink-0 text-[#71717A]" />
          Trk
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
            3
          </span>
        </span>
      </div>
    );
  }

  // index === 3
  return (
    <div className="flex flex-col gap-0.5 select-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
        <Truck size={10} className="shrink-0 text-[#71717A]" />
        U/Trk
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          1
        </span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-[#D4D4D8] bg-white text-[#09090B]">
        <Truck size={10} className="shrink-0 text-[#71717A]" />
        Trk
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#71717A] border border-[#D4D4D8] rounded-full ml-0.5">
          1
        </span>
      </span>
    </div>
  );
};

// ─── Sortable Column Header ───────────────────────────────────────────────────
const SortableHeader = ({ label, sortKey, sortConfig, onSort }) => {
  const isActive = sortConfig?.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 group cursor-pointer hover:text-[#09090B] transition-colors"
    >
      <span>{label}</span>
      <ChevronsUpDown
        size={12}
        className={`shrink-0 transition-colors ${isActive ? "text-[#09090B]" : "text-[#A1A1AA] group-hover:text-[#71717A]"}`}
      />
    </button>
  );
};

// ─── Main Table Component ─────────────────────────────────────────────────────
const OrderTable = ({ orders, loadingOrders, handleOrderClick, confirmDelete }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  // Client-side sort (only for columns with real sortable data)
  const sortedOrders = React.useMemo(() => {
    if (!orders || !sortConfig.key) return orders;
    return [...orders].sort((a, b) => {
      let aVal = a[sortConfig.key] ?? "";
      let bVal = b[sortConfig.key] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, sortConfig]);

  if (loadingOrders) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm" style={{ border: "1px solid var(--mn-surface)", boxShadow: "var(--mn-elevation-1)" }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid var(--mn-surface)", borderTopColor: "var(--mn-accent)" }} />
        <p className="text-[11px] font-medium mt-3" style={{ color: "var(--mn-text-tertiary)" }}>Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl p-4" style={{ border: "1px solid var(--mn-surface)", boxShadow: "var(--mn-elevation-1)" }}>
        <AlertCircle className="w-8 h-8 mb-2" style={{ color: "var(--mn-surface-alt)" }} />
        <p className="font-semibold text-sm" style={{ color: "var(--mn-text-tertiary)" }}>No orders found.</p>
        <p className="text-xs mt-1" style={{ color: "var(--mn-text-tertiary)" }}>Try resetting the filters or create a new order.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white" style={{ border: "1px solid var(--mn-surface)", boxShadow: "var(--mn-elevation-1)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" style={{ fontFamily: "var(--mn-font-primary)" }}>
          <thead>
            <tr
              className="text-[12px] font-semibold select-none"
              style={{ borderBottom: "1px solid var(--mn-surface)", backgroundColor: "var(--mn-background-3)", color: "var(--mn-text-tertiary)" }}
            >
              <th className="px-5 py-3.5 whitespace-nowrap font-semibold">Order Id</th>
              <th className="px-5 py-3.5 whitespace-nowrap font-semibold">Customer</th>
              <th className="px-5 py-3.5 whitespace-nowrap">
                <SortableHeader label="Product" sortKey="clotheType" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th className="px-5 py-3.5 whitespace-nowrap">
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th className="px-5 py-3.5 whitespace-nowrap font-semibold">Total Goj</th>
              <th className="px-5 py-3.5 whitespace-nowrap">
                <SortableHeader label="Billing" sortKey="paymentMethod" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th className="px-5 py-3.5 whitespace-nowrap">
                <SortableHeader label="Inventory" sortKey="inventory" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th className="px-5 py-3.5 w-10" />
            </tr>
          </thead>

          {/* ── Table Body ─────────────────────────────────────── */}
          <tbody className="divide-y" style={{ borderColor: "var(--mn-background-alt)" }}>
            {sortedOrders?.map((order, rowIndex) => {
              const orderId = order?._id || `row-${rowIndex}`;

              // Product
              const productCloth =
                order?.clotheType ||
                DUMMY_CLOTH_TYPES[getDummyIndex(orderId, DUMMY_CLOTH_TYPES.length)];
              const productQuality =
                order?.quality ||
                DUMMY_QUALITIES[getDummyIndex(orderId + "q", DUMMY_QUALITIES.length)];

              // Status
              const resolvedStatus =
                order?.status ||
                DUMMY_STATUSES[getDummyIndex(orderId + "s", DUMMY_STATUSES.length)];

              // Total Goj
              const realGoj =
                order?.totalGoj !== null && order?.totalGoj !== undefined
                  ? order.totalGoj
                  : order?.tableData?.length > 0
                  ? order.tableData.reduce((sum, item) => sum + (item.goj || 0), 0)
                  : null;
              const totalGojVal =
                realGoj !== null
                  ? realGoj
                  : DUMMY_GOJ_VALUES[getDummyIndex(orderId + "g", DUMMY_GOJ_VALUES.length)];

              // Format orderId to match Figma: #ord-2026-0217-533...
              const rawId = order?.orderId || order?._id || "";
              const displayId = rawId.startsWith("#ord-")
                ? rawId.slice(0, 22) + "..."
                : rawId
                ? "#ord-" + rawId.slice(-16)
                : `#ord-${orderId.slice(-16)}`;

              return (
                <tr
                  key={order?._id || rowIndex}
                  className="cursor-pointer transition-colors duration-100 group"
                  style={{ backgroundColor: "var(--mn-background)" }}
                  onClick={() => handleOrderClick(order?._id)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-background-alt)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-background)")}>
                  {/* Order ID */}
                  <td className="px-5 py-3.5 font-medium text-[13px] whitespace-nowrap" style={{ color: "var(--mn-text-primary)" }}>
                    <span className="font-mono text-[12px]">{displayId}</span>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-3.5 text-[13px] font-medium whitespace-nowrap max-w-[180px]" style={{ color: "var(--mn-text-primary)" }}>
                    <span className="truncate block max-w-[160px]">
                      {order?.companyName || "N/A"}
                    </span>
                  </td>

                  {/* Product */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 font-semibold text-[13px]" style={{ color: "var(--mn-text-primary)" }}>
                        <ShoppingBag size={11} className="shrink-0" style={{ color: "var(--mn-text-tertiary)" }} />
                        <span>{productCloth}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--mn-text-tertiary)" }}>
                        <span className="font-medium"># {productQuality}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderStatusBadges(resolvedStatus, orderId)}
                  </td>

                  {/* Total Goj */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderGojDetails(orderId, totalGojVal)}
                  </td>

                  {/* Billing */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderBillingBadges(order, orderId)}
                  </td>

                  {/* Inventory */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderInventoryBadges(order, orderId)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(order?._id);
                        }}
                        className="p-1.5 rounded-md text-[#A1A1AA] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete Order"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md text-[#A1A1AA] hover:text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
                      >
                        <MoreVertical size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
