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
const getDummyIndex = (id: string, poolLength: number) => {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % poolLength;
};

// ─── Status Badges — exact Figma match ───────────────────────────────────────
const renderStatusBadges = (status: string, orderId: string) => {
  const s = status?.toLowerCase() || "pending";

  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#f54e00]/20 bg-[#f54e00]/10 text-[#f54e00] select-none">
        <Clock size={12} className="shrink-0 text-[#f54e00]" />
        pending
      </span>
    );
  }

  if (s === "inprocess" || s === "in process" || s === "processing") {
    const deliveryNum = getDummyIndex(orderId + "del", 3) + 1;
    return (
      <div className="flex flex-col gap-1 select-none items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#3a6a9f]/20 bg-[#3a6a9f]/10 text-[#3a6a9f]">
          <Clock size={12} className="shrink-0 text-[#3a6a9f]" />
          in process
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]/70">
          <Truck size={12} className="shrink-0 text-[#26251e]/50" />
          Delivered
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#ebeae5] text-[#26251e]/70 rounded-full ml-0.5">
            {deliveryNum}
          </span>
        </span>
      </div>
    );
  }

  if (s === "done") {
    return (
      <div className="flex flex-col gap-1 select-none items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#1f8a65]/20 bg-[#1f8a65]/10 text-[#1f8a65]">
          <CheckCircle2 size={12} className="shrink-0 text-[#1f8a65]" />
          Done
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]/70">
          <Truck size={12} className="shrink-0 text-[#26251e]/50" />
          Delivered
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#ebeae5] text-[#26251e]/70 rounded-full ml-0.5">
            3
          </span>
        </span>
      </div>
    );
  }

  if (["completed", "delivered", "completedprocess", "complete"].includes(s)) {
    return (
      <div className="flex flex-col gap-1 select-none items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#1f8a65]/20 bg-[#1f8a65]/10 text-[#1f8a65]">
          <CheckCircle2 size={12} className="shrink-0 text-[#1f8a65]" />
          complete
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]/70">
          <Truck size={12} className="shrink-0 text-[#26251e]/50" />
          Delivered
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#ebeae5] text-[#26251e]/70 rounded-full ml-0.5">
            3
          </span>
        </span>
      </div>
    );
  }

  if (s === "batch") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#6049b3]/20 bg-[#6049b3]/10 text-[#6049b3] select-none">
        <Clock size={12} className="shrink-0 text-[#6049b3]" />
        Batching
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]/60 select-none">
      <Clock size={12} className="shrink-0 text-[#26251e]/40" />
      {s}
    </span>
  );
};

// ─── Total Goj — exact Figma match ───────────────────────────────────────────
const renderGojDetails = (orderId: string, totalGojVal: number) => {
  const index = getDummyIndex(orderId + "goj_v2", 7);

  const patterns = [
    { rows: [] },
    {
      rows: [
        { icon: "x",     text: "7~1525",       cls: "text-[#cf2d56] bg-[#cf2d56]/10 border-[#cf2d56]/20" },
        { icon: "clock", text: "3/ 39~2602",   cls: "text-[#26251e]/60 bg-[#f7f7f4] border-[color-mix(in_oklab,#26251e_10%,transparent)]" },
      ],
    },
    {
      rows: [
        { icon: "x",     text: "7~1525",       cls: "text-[#cf2d56] bg-[#cf2d56]/10 border-[#cf2d56]/20" },
        { icon: "clock", text: "4/ 39~12525",  cls: "text-[#26251e]/60 bg-[#f7f7f4] border-[color-mix(in_oklab,#26251e_10%,transparent)]" },
        { icon: "check", text: "2/ 24~4337",   cls: "text-[#1f8a65] bg-[#1f8a65]/10 border-[#1f8a65]/20", trend: "-5.2%" },
      ],
    },
    {
      rows: [
        { icon: "clock", text: "3/ 32~12525",  cls: "text-[#26251e]/60 bg-[#f7f7f4] border-[color-mix(in_oklab,#26251e_10%,transparent)]" },
        { icon: "check", text: "4/ 37~8560",   cls: "text-[#1f8a65] bg-[#1f8a65]/10 border-[#1f8a65]/20", trend: "-6.2%" },
      ],
    },
    {
      rows: [
        { icon: "check", text: "7/ 59~16256",  cls: "text-[#1f8a65] bg-[#1f8a65]/10 border-[#1f8a65]/20", trend: "-5.9%" },
      ],
    },
    {
      rows: [
        { icon: "x",     text: "7~1525",       cls: "text-[#cf2d56] bg-[#cf2d56]/10 border-[#cf2d56]/20" },
        { icon: "clock", text: "3/ 52~12525",  cls: "text-[#26251e]/60 bg-[#f7f7f4] border-[color-mix(in_oklab,#26251e_10%,transparent)]" },
        { icon: "check", text: "2/ 24~10255",  cls: "text-[#1f8a65] bg-[#1f8a65]/10 border-[#1f8a65]/20", trend: "-17.5%" },
      ],
    },
    {
      rows: [
        { icon: "check", text: "7/ 59~16256",  cls: "text-[#1f8a65] bg-[#1f8a65]/10 border-[#1f8a65]/20", trend: "-5.9%" },
      ],
    },
  ];

  const { rows } = patterns[index];

  return (
    <div className="flex flex-col gap-1 py-0.5 select-none min-w-[120px]">
      <span className="font-semibold text-[#26251e] text-[13px] leading-tight">
        Gry {totalGojVal >= 80000 ? "83" : "53"}~{totalGojVal}
      </span>
      {rows.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {rows.map((rec, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-[4px] border text-[9px] font-semibold ${rec.cls}`}>
                {rec.icon === "x" && <X size={7} strokeWidth={3} className="shrink-0" />}
                {rec.icon === "clock" && <Clock size={7} className="shrink-0" />}
                {rec.icon === "check" && <CheckCircle2 size={7} className="shrink-0" />}
                <span>{rec.text}</span>
              </span>
              {rec.trend && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-[4px] border border-[#cf2d56]/20 bg-[#f7f7f4] text-[#cf2d56] text-[9px] font-bold">
                  <TrendingDown size={7} className="shrink-0" />
                  <span className="text-[#26251e]">{rec.trend}</span>
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
const renderBillingBadges = (order: any, orderId: string) => {
  const s = order?.status?.toLowerCase() || "pending";
  const isCompleted = ["completed", "delivered", "completedprocess", "complete"].includes(s);

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e] select-none">
        <FileText size={12} className="shrink-0 text-[#26251e]/60" />
        Bill
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
          7
        </span>
      </span>
    );
  }

  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]/60 select-none">
        <Clock size={12} className="shrink-0 text-[#26251e]/40" />
        pending
      </span>
    );
  }

  const index = getDummyIndex(orderId + "billing_v2", 4);

  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e] select-none">
        <FileText size={12} className="shrink-0 text-[#26251e]/60" />
        U/B
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <FileText size={12} className="shrink-0 text-[#26251e]/60" />
          U/B
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            {ubN}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <FileText size={12} className="shrink-0 text-[#26251e]/60" />
          Bill
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            {billN}
          </span>
        </span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <FileText size={12} className="shrink-0 text-[#26251e]/60" />
          U/B
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            5
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <FileText size={12} className="shrink-0 text-[#26251e]/60" />
          Bill
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            2
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 select-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
        <FileText size={12} className="shrink-0 text-[#26251e]/60" />
        U/B
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
          2
        </span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
        <FileText size={12} className="shrink-0 text-[#26251e]/60" />
        Bill
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
          0
        </span>
      </span>
    </div>
  );
};

// ─── Inventory Badges — exact Figma match ────────────────────────────────────
const renderInventoryBadges = (order: any, orderId: string) => {
  const s = order?.status?.toLowerCase() || "pending";
  const isCompleted = ["completed", "delivered", "completedprocess", "complete"].includes(s);

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e] select-none">
        <Truck size={12} className="shrink-0 text-[#26251e]/60" />
        Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
          7
        </span>
      </span>
    );
  }

  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]/60 select-none">
        <Clock size={12} className="shrink-0 text-[#26251e]/40" />
        pending
      </span>
    );
  }

  const index = getDummyIndex(orderId + "inv_v2", 4);

  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e] select-none">
        <Truck size={12} className="shrink-0 text-[#26251e]/60" />
        U/Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
          2
        </span>
      </span>
    );
  }

  if (index === 1) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <Truck size={12} className="shrink-0 text-[#26251e]/60" />
          U/Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            3
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <Truck size={12} className="shrink-0 text-[#26251e]/60" />
          Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            1
          </span>
        </span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <Truck size={12} className="shrink-0 text-[#26251e]/60" />
          U/Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            4
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
          <Truck size={12} className="shrink-0 text-[#26251e]/60" />
          Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
            3
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 select-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
        <Truck size={12} className="shrink-0 text-[#26251e]/60" />
        U/Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
          1
        </span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[color-mix(in_oklab,#26251e_10%,transparent)] bg-[#f7f7f4] text-[#26251e]">
        <Truck size={12} className="shrink-0 text-[#26251e]/60" />
        Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-[#f7f7f4] text-[#26251e]/60 border border-[color-mix(in_oklab,#26251e_10%,transparent)] rounded-full ml-0.5">
          1
        </span>
      </span>
    </div>
  );
};

// ─── Sortable Column Header ───────────────────────────────────────────────────
const SortableHeader = ({ label, sortKey, sortConfig, onSort }: any) => {
  const isActive = sortConfig?.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 group cursor-pointer hover:text-[#26251e] transition-colors"
    >
      <span>{label}</span>
      <ChevronsUpDown
        size={12}
        className={`shrink-0 transition-colors ${isActive ? "text-[#26251e]" : "text-[#26251e]/40 group-hover:text-[#26251e]/60"}`}
      />
    </button>
  );
};

interface OrderTableProps {
  orders: any[];
  loadingOrders: boolean;
  handleOrderClick: (id: string) => void;
  confirmDelete: (id: string) => void;
}

// ─── Main Table Component ─────────────────────────────────────────────────────
const OrderTable: React.FC<OrderTableProps> = ({ orders, loadingOrders, handleOrderClick, confirmDelete }) => {
  const [sortConfig, setSortConfig] = useState<{key: string | null; dir: "asc" | "desc"}>({ key: null, dir: "asc" });

  const handleSort = (key: string) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const sortedOrders = React.useMemo(() => {
    if (!orders || !sortConfig.key) return orders;
    return [...orders].sort((a, b) => {
      let aVal = a[sortConfig.key as string] ?? "";
      let bVal = b[sortConfig.key as string] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, sortConfig]);

  if (loadingOrders) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-[#f2f1ed] rounded-[8px] shadow-sm border border-[color-mix(in_oklab,#26251e_10%,transparent)]">
        <div className="w-8 h-8 rounded-full animate-spin border-2 border-[color-mix(in_oklab,#26251e_10%,transparent)] border-t-[#26251e]" />
        <p className="text-[11px] font-medium mt-3 text-[#26251e]/60">Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-[#f2f1ed] rounded-[8px] p-4 border border-[color-mix(in_oklab,#26251e_10%,transparent)] shadow-sm">
        <AlertCircle className="w-8 h-8 mb-2 text-[#26251e]/40" />
        <p className="font-semibold text-sm text-[#26251e]/60">No orders found.</p>
        <p className="text-xs mt-1 text-[#26251e]/40">Try resetting the filters or create a new order.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[8px] bg-[#f7f7f4] border border-[color-mix(in_oklab,#26251e_10%,transparent)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-[14px] font-semibold select-none bg-[#f2f1ed] text-[#26251e]/60 border-b border-[color-mix(in_oklab,#26251e_10%,transparent)]"
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

          <tbody className="divide-y divide-[color-mix(in_oklab,#26251e_10%,transparent)]">
            {sortedOrders?.map((order, rowIndex) => {
              const orderId = order?._id || `row-${rowIndex}`;

              const productCloth = order?.clotheType || DUMMY_CLOTH_TYPES[getDummyIndex(orderId, DUMMY_CLOTH_TYPES.length)];
              const productQuality = order?.quality || DUMMY_QUALITIES[getDummyIndex(orderId + "q", DUMMY_QUALITIES.length)];
              const resolvedStatus = order?.status || DUMMY_STATUSES[getDummyIndex(orderId + "s", DUMMY_STATUSES.length)];
              
              const realGoj = order?.totalGoj !== null && order?.totalGoj !== undefined
                ? order.totalGoj
                : order?.tableData?.length > 0
                ? order.tableData.reduce((sum: number, item: any) => sum + (item.goj || 0), 0)
                : null;
              const totalGojVal = realGoj !== null ? realGoj : DUMMY_GOJ_VALUES[getDummyIndex(orderId + "g", DUMMY_GOJ_VALUES.length)];

              const rawId = order?.orderId || order?._id || "";
              const displayId = rawId.startsWith("#ord-")
                ? rawId.slice(0, 22) + "..."
                : rawId
                ? "#ord-" + rawId.slice(-16)
                : `#ord-${orderId.slice(-16)}`;

              return (
                <tr
                  key={order?._id || rowIndex}
                  className="cursor-pointer transition-colors duration-100 group bg-[#f7f7f4] hover:bg-[#ebeae5]"
                  onClick={() => handleOrderClick(order?._id)}
                >
                  <td className="px-5 py-3.5 font-medium text-[15px] whitespace-nowrap text-[#26251e]">
                    <span className="font-mono text-[14px]">{displayId}</span>
                  </td>

                  <td className="px-5 py-3.5 text-[15px] font-medium whitespace-nowrap max-w-[180px] text-[#26251e]">
                    <span className="truncate block max-w-[160px]">
                      {order?.companyName || "N/A"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 font-semibold text-[15px] text-[#26251e]">
                        <ShoppingBag size={13} className="shrink-0 text-[#26251e]/40" />
                        <span>{productCloth}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[13px] text-[#26251e]/60">
                        <span className="font-medium"># {productQuality}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderStatusBadges(resolvedStatus, orderId)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderGojDetails(orderId, totalGojVal)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderBillingBadges(order, orderId)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderInventoryBadges(order, orderId)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(order?._id);
                        }}
                        className="p-1.5 rounded-[4px] text-[#26251e]/40 hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete Order"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-[4px] text-[#26251e]/40 hover:text-[#26251e]/60 hover:bg-[#ebeae5] transition-colors"
                      >
                        <MoreVertical size={15} />
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
