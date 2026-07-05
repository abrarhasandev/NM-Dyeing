"use client";
import React from "react";
import { 
  ShoppingBag, 
  Hash, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical, 
  AlertCircle, 
  Coins,
  Package,
  Trash2,
  RotateCcw,
  Truck,
  TrendingDown,
  FileText
} from "lucide-react";

// Fallback dummy data pools for columns that may have missing data.
// These are purely visual placeholders — they do NOT connect to the database.
const DUMMY_CLOTH_TYPES = ["পলিষ্টার", "লোন", "কটন", "সিল্ক", "টিসি", "ভিসকস", "লিনেন", "জর্জেট"];
const DUMMY_QUALITIES = ["ষ্টাইপ", "1200", "1800", "1400", "1600", "1000", "1500", "1100"];
const DUMMY_STATUSES = ["pending", "inprocess", "completed", "batch", "billing", "completedprocess"];
const DUMMY_GOJ_VALUES = [18625, 1525, 12525, 16256, 26525, 4337, 8560, 10255];

// Simple hash-based selector for consistent dummy values per order
const getDummyIndex = (id, poolLength) => {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % poolLength;
};

// Render status badges to match Figma mockup options and designs (white bg, grey border, #737373 text)
const renderStatusBadges = (status, orderId) => {
  const s = status?.toLowerCase() || "pending";
  
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm select-none">
        <Clock size={11} className="shrink-0 text-neutral-400" />
        <span>pending</span>
      </span>
    );
  }
  
  if (s === "inprocess" || s === "in process" || s === "processing") {
    const deliveryNum = getDummyIndex(orderId + "status_del", 2) + 1; // 1 or 2
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm">
          <Clock size={11} className="shrink-0 text-neutral-400 animate-pulse" />
          <span>in process</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-400" />
          <span>Delivered</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#8E8E93] border border-[rgba(34,43,89,0.4)] rounded-full">
            {deliveryNum}
          </span>
        </span>
      </div>
    );
  }
  
  if (s === "batch") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm select-none">
        <Package size={11} className="shrink-0 text-neutral-400" />
        <span>Batching</span>
      </span>
    );
  }

  if (s === "completed" || s === "delivered" || s === "completedprocess" || s === "done") {
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm">
          <CheckCircle2 size={11} className="shrink-0 text-neutral-400" />
          <span>complete</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-400" />
          <span>Delivered</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#8E8E93] border border-[rgba(34,43,89,0.4)] rounded-full">
            3
          </span>
        </span>
      </div>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm select-none">
      <Clock size={11} className="shrink-0 text-neutral-400" />
      <span>{s}</span>
    </span>
  );
};

// Render total goj and process details underneath to match Figma mockup
const renderGojDetails = (orderId, totalGojVal) => {
  const index = getDummyIndex(orderId + "goj_detail", 6);
  let subRecords = [];
  
  if (index === 1) {
    subRecords = [
      { type: "pending", text: "22~1525", color: "text-rose-500 bg-rose-50 border-rose-100" },
      { type: "pending", text: "3/ 52~12525", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ];
  } else if (index === 2) {
    subRecords = [
      { type: "pending", text: "22~1525", color: "text-rose-500 bg-rose-50 border-rose-100" },
      { type: "pending", text: "3/ 52~12525", color: "text-blue-600 bg-blue-50 border-blue-100" },
      { type: "completed", text: "2/ 24~10255", trend: "-5.2%", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ];
  } else if (index === 3) {
    subRecords = [
      { type: "pending", text: "3/ 32~12525", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { type: "completed", text: "4/ 37~8560", trend: "-6.2%", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ];
  } else if (index === 4) {
    subRecords = [
      { type: "completed", text: "7/ 59~16256", trend: "-5.9%", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ];
  } else if (index === 5) {
    subRecords = [
      { type: "pending", text: "22~1525", color: "text-rose-500 bg-rose-50 border-rose-100" },
      { type: "pending", text: "3/ 52~12525", color: "text-rose-500 bg-rose-50 border-rose-100" },
      { type: "completed", text: "2/ 24~10255", trend: "-17.5%", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ];
  }
  
  return (
    <div className="flex flex-col gap-1 py-1 select-none">
      <span className="font-semibold text-neutral-800 text-[13px]">
        Gry 53~{totalGojVal}
      </span>
      {subRecords.length > 0 && (
        <div className="flex flex-col gap-1 mt-0.5">
          {subRecords.map((rec, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] font-medium text-neutral-500">
              <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded border text-[9px] ${rec.color}`}>
                {rec.type === "completed" ? (
                  <CheckCircle2 size={8} className="shrink-0" />
                ) : (
                  <RotateCcw size={8} className="shrink-0" />
                )}
                <span>{rec.text}</span>
              </span>
              {rec.trend && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded border border-[#CB5254] bg-white text-rose-600 text-[8px] font-semibold">
                  <TrendingDown size={8} className="text-[#CB5254] shrink-0" />
                  <span className="text-[8px] font-bold text-neutral-900">{rec.trend}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Render billing badges matching Figma mockup (outline style, nested numeric circles)
const renderBillingBadges = (order, orderId) => {
  const isRealPaid = order?.paymentMethod === "Paid";
  const isRealCompleted = order?.status === "completed" || order?.status === "delivered";
  
  if (isRealPaid || isRealCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm select-none">
        <FileText size={11} className="shrink-0 text-neutral-500" />
        <span>Billed</span>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
          7
        </span>
      </span>
    );
  }
  
  const index = getDummyIndex(orderId + "billing_detail", 5);
  
  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm select-none">
        <Clock size={11} className="shrink-0 text-neutral-400" />
        <span>pending</span>
      </span>
    );
  } else if (index === 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm select-none">
        <FileText size={11} className="shrink-0 text-neutral-500" />
        <span>U/B</span>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#737373] border border-[rgba(34,43,89,0.4)] rounded-full">
          2
        </span>
      </span>
    );
  } else if (index === 2) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <FileText size={11} className="shrink-0 text-neutral-500" />
          <span>U/B</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#737373] border border-[rgba(34,43,89,0.4)] rounded-full">
            3
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <FileText size={11} className="shrink-0 text-neutral-500" />
          <span>Bill</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#737373] border border-[rgba(34,43,89,0.4)] rounded-full">
            1
          </span>
        </span>
      </div>
    );
  } else if (index === 3) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <FileText size={11} className="shrink-0 text-neutral-500" />
          <span>U/B</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#737373] border border-[rgba(34,43,89,0.4)] rounded-full">
            5
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <FileText size={11} className="shrink-0 text-neutral-500" />
          <span>Bill</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#737373] border border-[rgba(34,43,89,0.4)] rounded-full">
            2
          </span>
        </span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <FileText size={11} className="shrink-0 text-neutral-500" />
          <span>U/B</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#737373] border border-[rgba(34,43,89,0.4)] rounded-full">
            2
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <FileText size={11} className="shrink-0 text-neutral-500" />
          <span>Bill</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#737373] border border-[rgba(34,43,89,0.4)] rounded-full">
            0
          </span>
        </span>
      </div>
    );
  }
};

// Render inventory badges matching Figma mockup (outline style, nested numeric circles, kick scooter/delivery icon)
const renderInventoryBadges = (order, orderId) => {
  const s = order?.status?.toLowerCase() || "pending";
  const isRealCompleted = s === "completed" || s === "delivered" || s === "completedprocess";
  
  if (isRealCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm select-none">
        <Truck size={11} className="shrink-0 text-neutral-500" />
        <span>Trk</span>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
          7
        </span>
      </span>
    );
  }
  
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#E5E5E5] bg-white text-[#737373] shadow-sm select-none">
        <Clock size={11} className="shrink-0 text-neutral-400" />
        <span>pending</span>
      </span>
    );
  }
  
  const index = getDummyIndex(orderId + "inventory_detail", 4);
  
  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm select-none">
        <Truck size={11} className="shrink-0 text-neutral-500" />
        <span>U/Trk</span>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
          2
        </span>
      </span>
    );
  } else if (index === 1) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-500" />
          <span>U/Trk</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
            3
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-500" />
          <span>Trk</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
            1
          </span>
        </span>
      </div>
    );
  } else if (index === 2) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-500" />
          <span>U/Trk</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
            4
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-500" />
          <span>Trk</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
            3
          </span>
        </span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1.5 flex-wrap select-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-500" />
          <span>U/Trk</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
            1
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg border border-[#8E8E93] bg-white text-black shadow-sm">
          <Truck size={11} className="shrink-0 text-neutral-500" />
          <span>Trk</span>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold bg-white text-[#595959] border border-[rgba(34,43,89,0.4)] rounded-full">
            1
          </span>
        </span>
      </div>
    );
  }
};

const OrderTable = ({ orders, loadingOrders, handleOrderClick, confirmDelete }) => {
  if (loadingOrders) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-white border border-neutral-200/80 rounded-xl shadow-sm animate-pulse">
        <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-500 font-medium mt-3">Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-white border border-neutral-200/80 rounded-xl shadow-sm p-4">
        <AlertCircle className="w-10 h-10 text-neutral-300 mb-2" />
        <p className="text-neutral-500 font-medium text-sm">No orders found.</p>
        <p className="text-xs text-neutral-400 mt-1">Try resetting the filters or create a new order.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border border-neutral-200/80 rounded-xl shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 text-[11px] font-bold uppercase tracking-wider select-none">
              <th className="px-6 py-4.5">Order Id</th>
              <th className="px-6 py-4.5">Customer</th>
              <th className="px-6 py-4.5">Product</th>
              <th className="px-6 py-4.5">Status</th>
              <th className="px-6 py-4.5">Total Goj</th>
              <th className="px-6 py-4.5">Billing</th>
              <th className="px-6 py-4.5">Inventory</th>
              <th className="px-6 py-4.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-[13px]">
            {orders?.map((order, rowIndex) => {
              const orderId = order?._id || `row-${rowIndex}`;

              // --- Resolve real vs dummy data per column ---
              // Product: clotheType & quality
              const productCloth = order?.clotheType || DUMMY_CLOTH_TYPES[getDummyIndex(orderId, DUMMY_CLOTH_TYPES.length)];
              const productQuality = order?.quality || DUMMY_QUALITIES[getDummyIndex(orderId + "q", DUMMY_QUALITIES.length)];

              // Status
              const resolvedStatus = order?.status || DUMMY_STATUSES[getDummyIndex(orderId + "s", DUMMY_STATUSES.length)];

              // Total Goj
              const realGoj = order?.totalGoj !== null && order?.totalGoj !== undefined
                ? order?.totalGoj
                : order?.tableData && order?.tableData.length > 0
                  ? order.tableData.reduce((sum, item) => sum + (item.goj || 0), 0)
                  : null;
              const totalGojVal = realGoj !== null ? realGoj : DUMMY_GOJ_VALUES[getDummyIndex(orderId + "g", DUMMY_GOJ_VALUES.length)];

              return (
                <tr
                  key={order?._id}
                  className="hover:bg-neutral-50/50 cursor-pointer transition-colors duration-150 group"
                  onClick={() => handleOrderClick(order?._id)}
                >
                  {/* Order ID */}
                  <td className="px-6 py-4.5 font-semibold text-neutral-900 whitespace-nowrap">
                    <span className="text-neutral-500 font-medium mr-0.5">#</span>
                    {order?.orderId?.replace(/^#?ord-/, "") || order?._id?.slice(-6)}
                  </td>
                  
                  {/* Customer */}
                  <td className="px-6 py-4.5 font-medium text-neutral-800 whitespace-nowrap">
                    {order?.companyName || "N/A"}
                  </td>
                  
                  {/* Product (Cloth Type and Quality) with Figma Icons */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-neutral-800 font-semibold text-[13px]">
                        <ShoppingBag size={12} className="text-neutral-400" />
                        <span>{productCloth}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-normal">
                        <span># {productQuality}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    {renderStatusBadges(resolvedStatus, orderId)}
                  </td>

                  {/* Total Goj (Neutral Pill Badge with sub-details) */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    {renderGojDetails(orderId, totalGojVal)}
                  </td>

                  {/* Billing Badge */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    {renderBillingBadges(order, orderId)}
                  </td>

                  {/* Inventory Badge */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    {renderInventoryBadges(order, orderId)}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4.5 whitespace-nowrap text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(order?._id);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete Order"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                        <MoreVertical size={14} />
                      </div>
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
