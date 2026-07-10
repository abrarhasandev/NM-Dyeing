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
  TrendingUp,
  FileText,
  ChevronsUpDown,
  XCircle,
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
const renderStatusBadges = (order: any, orderId: string, handleOrderClick: any) => {
  const status = order?.status?.toLowerCase() || "pending";
  const batchCount = order?.batchSummary?.batchCount || 0;
  const dispatchCount = order?.batchSummary?.dispatchCount || 0;

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#f54e00]/20 bg-[#f54e00]/10 text-[#f54e00] select-none">
        <Clock size={12} className="shrink-0 text-[#f54e00]" />
        pending
      </span>
    );
  }

  const isCompleted = ["done", "completed", "delivered", "completedprocess", "complete"].includes(status);

  if (isCompleted) {
    return (
      <div className="flex flex-col gap-1 select-none items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#1f8a65]/20 bg-[#1f8a65]/10 text-[#1f8a65]">
          <CheckCircle2 size={12} className="shrink-0 text-[#1f8a65]" />
          complete
        </span>
        {order?.batchSummary?.invoiceCount > 0 && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground/70 cursor-pointer hover:bg-accent transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (handleOrderClick) handleOrderClick(orderId, "Billing");
            }}
          >
            <Truck size={12} className="shrink-0 text-foreground/50" />
            Dispatch
            <span className="inline-flex items-center justify-center px-1.5 h-4 text-[11px] font-bold bg-accent text-foreground/70 rounded-full ml-0.5">
              {order?.batchSummary?.invoiceCount}
            </span>
          </span>
        )}
      </div>
    );
  }

  if (batchCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#6049b3]/20 bg-[#6049b3]/10 text-[#6049b3] select-none">
        <Clock size={12} className="shrink-0 text-[#6049b3]" />
        Batching
      </span>
    );
  } else {
    return (
      <div className="flex flex-col gap-1 select-none items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-[#3a6a9f]/20 bg-[#3a6a9f]/10 text-[#3a6a9f]">
          <Clock size={12} className="shrink-0 text-[#3a6a9f]" />
          in process
        </span>
        {order?.batchSummary?.invoiceCount > 0 && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground/70 cursor-pointer hover:bg-accent transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (handleOrderClick) handleOrderClick(orderId, "Billing");
            }}
          >
            <Truck size={12} className="shrink-0 text-foreground/50" />
            Dispatch
            <span className="inline-flex items-center justify-center px-1.5 h-4 text-[11px] font-bold bg-accent text-foreground/70 rounded-full ml-0.5">
              {order?.batchSummary?.invoiceCount}
            </span>
          </span>
        )}
      </div>
    );
  }
};

// ─── Total Goj — exact Figma match ───────────────────────────────────────────
const renderGojDetails = (order: any, orderId: string, totalGojVal: number, totalBundleVal: number) => {
  const status = order?.status?.toLowerCase() || "pending";
  const batchCount = order?.batchSummary?.batchCount || 0;
  const batchBundle = order?.batchSummary?.totalBatchBundle || 0;
  const batchGoj = order?.batchSummary?.totalBatchGoj || 0;

  const dispatchCount = order?.batchSummary?.dispatchCount || 0;
  const dispatchTotalBundle = order?.batchSummary?.dispatchTotalBundle || 0;
  const dispatchTotalGoj = order?.batchSummary?.dispatchTotalGoj || 0;
  const dispatchOriginalGoj = order?.batchSummary?.dispatchOriginalGoj || 0;

  const remainingBundle = Math.max(0, totalBundleVal - batchBundle);
  const remainingGoj = Math.max(0, totalGojVal - batchGoj);

  const isCompleted = ["done", "completed", "delivered", "completedprocess", "complete"].includes(status);

  const rows = [];

  if (status !== "pending") {
    // Row 2: Remaining Unbatched
    if (remainingBundle > 0 || remainingGoj > 0) {
      rows.push({
        icon: "x",
        text: `${remainingBundle}~${remainingGoj}`,
        cls: "text-muted-foreground bg-background border-border",
      });
    }

    // Row 3: Active Batches in process
    const activeBatchCount = Math.max(0, batchCount - dispatchCount);
    const activeBatchBundle = Math.max(0, batchBundle - dispatchTotalBundle);
    const activeBatchGoj = Math.max(0, batchGoj - dispatchOriginalGoj);

    if (activeBatchCount > 0) {
      rows.push({
        icon: "clock",
        text: `${activeBatchCount}/ ${activeBatchBundle}~${activeBatchGoj}`,
        cls: "text-[#3a6a9f] bg-[#3a6a9f]/10 border-[#3a6a9f]/20",
      });
    }

    // Row 4: Dispatch Totals
    if (dispatchCount > 0) {
      let trend = null;
      let trendNum = 0;
      if (dispatchOriginalGoj > 0) {
        trendNum = ((dispatchTotalGoj - dispatchOriginalGoj) / dispatchOriginalGoj) * 100;
        trend = `${trendNum > 0 ? "+" : ""}${trendNum.toFixed(1)}%`;
      }

      rows.push({
        icon: "check",
        text: `${dispatchCount}/ ${dispatchTotalBundle}~${dispatchTotalGoj}`,
        cls: "text-[#1f8a65] bg-[#1f8a65]/10 border-[#1f8a65]/20",
        trend: trend,
        trendIsDown: trendNum < 0,
      });
    }
  }

  return (
    <div className="flex flex-col gap-1 py-0.5 select-none min-w-[120px]">
      <span className="font-semibold text-foreground text-[13px] leading-tight">
        Gry {totalBundleVal}~{totalGojVal}
      </span>
      {rows.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {rows.map((rec, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-[4px] border text-[9px] font-semibold ${rec.cls}`}>
                {rec.icon === "x" && <XCircle size={7} strokeWidth={3} className="shrink-0" />}
                {rec.icon === "clock" && <Clock size={7} className="shrink-0" />}
                {rec.icon === "check" && <CheckCircle2 size={7} className="shrink-0" />}
                <span>{rec.text}</span>
              </span>
              {rec.trend && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-[4px] border border-border bg-background text-[9px] font-bold ${rec.trendIsDown ? 'text-[#cf2d56]' : 'text-[#1f8a65]'}`}>
                  {rec.trendIsDown ? <TrendingDown size={7} className="shrink-0" /> : <TrendingUp size={7} className="shrink-0" />}
                  <span className="text-foreground">{rec.trend}</span>
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground select-none">
        <FileText size={12} className="shrink-0 text-muted-foreground" />
        Bill
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
          7
        </span>
      </span>
    );
  }

  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-muted-foreground select-none">
        <Clock size={12} className="shrink-0 text-muted-foreground/70" />
        pending
      </span>
    );
  }

  const index = getDummyIndex(orderId + "billing_v2", 4);

  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground select-none">
        <FileText size={12} className="shrink-0 text-muted-foreground" />
        U/B
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <FileText size={12} className="shrink-0 text-muted-foreground" />
          U/B
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            {ubN}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <FileText size={12} className="shrink-0 text-muted-foreground" />
          Bill
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            {billN}
          </span>
        </span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <FileText size={12} className="shrink-0 text-muted-foreground" />
          U/B
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            5
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <FileText size={12} className="shrink-0 text-muted-foreground" />
          Bill
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            2
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 select-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
        <FileText size={12} className="shrink-0 text-muted-foreground" />
        U/B
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
          2
        </span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
        <FileText size={12} className="shrink-0 text-muted-foreground" />
        Bill
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground select-none">
        <Truck size={12} className="shrink-0 text-muted-foreground" />
        Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
          7
        </span>
      </span>
    );
  }

  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-muted-foreground select-none">
        <Clock size={12} className="shrink-0 text-muted-foreground/70" />
        pending
      </span>
    );
  }

  const index = getDummyIndex(orderId + "inv_v2", 4);

  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground select-none">
        <Truck size={12} className="shrink-0 text-muted-foreground" />
        U/Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
          2
        </span>
      </span>
    );
  }

  if (index === 1) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <Truck size={12} className="shrink-0 text-muted-foreground" />
          U/Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            3
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <Truck size={12} className="shrink-0 text-muted-foreground" />
          Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            1
          </span>
        </span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="flex flex-col gap-0.5 select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <Truck size={12} className="shrink-0 text-muted-foreground" />
          U/Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            4
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
          <Truck size={12} className="shrink-0 text-muted-foreground" />
          Trk
          <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
            3
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 select-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
        <Truck size={12} className="shrink-0 text-muted-foreground" />
        U/Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
          1
        </span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-medium rounded-full border border-border bg-background text-foreground">
        <Truck size={12} className="shrink-0 text-muted-foreground" />
        Trk
        <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] font-bold bg-background text-muted-foreground border border-border rounded-full ml-0.5">
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
      className="inline-flex items-center gap-1 group cursor-pointer hover:text-foreground transition-colors"
    >
      <span>{label}</span>
      <ChevronsUpDown
        size={12}
        className={`shrink-0 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-muted-foreground"}`}
      />
    </button>
  );
};

interface OrderTableProps {
  orders: any[];
  loadingOrders: boolean;
  handleOrderClick: (id: string, tab?: string) => void;
  confirmDelete: (id: string) => void;
}

// ─── Main Table Component ─────────────────────────────────────────────────────
const OrderTable: React.FC<OrderTableProps> = ({ orders, loadingOrders, handleOrderClick, confirmDelete }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; dir: "asc" | "desc" }>({ key: null, dir: "asc" });

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
      <div className="flex flex-col justify-center items-center h-64 bg-card rounded-[8px] shadow-sm border border-border">
        <div className="w-8 h-8 rounded-full animate-spin border-2 border-border border-t-[#26251e]" />
        <p className="text-[11px] font-medium mt-3 text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-card rounded-[8px] p-4 border border-border shadow-sm">
        <AlertCircle className="w-8 h-8 mb-2 text-muted-foreground/70" />
        <p className="font-semibold text-sm text-muted-foreground">No orders found.</p>
        <p className="text-xs mt-1 text-muted-foreground/70">Try resetting the filters or create a new order.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[8px] bg-background border border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-[14px] font-semibold select-none bg-card text-muted-foreground border-b border-border"
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

              const realBundle = order?.totalBundle !== null && order?.totalBundle !== undefined && order?.totalBundle !== ""
                ? Number(order.totalBundle)
                : order?.tableData?.length > 0
                  ? order.tableData.length
                  : null;
              const totalBundleVal = realBundle !== null ? realBundle : (totalGojVal >= 80000 ? 83 : 53);

              const rawId = order?.orderId || order?._id || "";
              const displayId = rawId.startsWith("#ord-")
                ? rawId.slice(0, 22) + "..."
                : rawId
                  ? "#ord-" + rawId.slice(-16)
                  : `#ord-${orderId.slice(-16)}`;

              return (
                <tr
                  key={order?._id || rowIndex}
                  className="cursor-pointer transition-colors duration-100 group bg-background hover:bg-accent"
                  onClick={() => handleOrderClick(order?._id)}
                >
                  <td className="px-5 py-3.5 font-medium text-[15px] whitespace-nowrap text-foreground">
                    <span className="font-mono text-[14px]">{displayId}</span>
                  </td>

                  <td className="px-5 py-3.5 text-[15px] font-medium whitespace-nowrap max-w-[180px] text-foreground">
                    <span className="truncate block max-w-[160px]">
                      {order?.companyName || "N/A"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 font-semibold text-[15px] text-foreground">
                        <ShoppingBag size={13} className="shrink-0 text-muted-foreground/70" />
                        <span>{productCloth}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                        <span className="font-medium"># {productQuality}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderStatusBadges(order, order._id, handleOrderClick)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {renderGojDetails(order, orderId, totalGojVal, totalBundleVal)}
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
                        className="p-1.5 rounded-[4px] text-muted-foreground/70 hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete Order"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-[4px] text-muted-foreground/70 hover:text-muted-foreground hover:bg-accent transition-colors"
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
