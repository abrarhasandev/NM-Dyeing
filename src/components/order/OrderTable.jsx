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
  Trash2
} from "lucide-react";

// Status Badge Color & Icon Mapping
const getStatusBadge = (status) => {
  const s = status?.toLowerCase() || "pending";
  
  switch (s) {
    case "completed":
    case "completedprocess":
    case "delivered":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        icon: <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />,
        text: s === "completedprocess" ? "Finished" : s,
      };
    case "cancelled":
    case "canceled":
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200/80",
        icon: <XCircle size={13} className="text-rose-600 shrink-0" />,
        text: "Cancelled",
      };
    case "inprocess":
    case "in process":
    case "processing":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200/80",
        icon: <Clock size={13} className="text-blue-600 shrink-0 animate-pulse" />,
        text: "Processing",
      };
    case "batch":
      return {
        bg: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
        icon: <Package size={13} className="text-cyan-600 shrink-0" />,
        text: "Batching",
      };
    case "calender":
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        icon: <Clock size={13} className="text-indigo-600 shrink-0" />,
        text: "Calendering",
      };
    case "billing":
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200/80",
        icon: <Coins size={13} className="text-purple-600 shrink-0" />,
        text: "Billing",
      };
    case "pending":
    default:
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200/80",
        icon: <Clock size={13} className="text-amber-600 shrink-0" />,
        text: "Pending",
      };
  }
};

const getBillingBadge = (paymentMethod, orderStatus) => {
  const isPaid = paymentMethod === "Paid" || orderStatus === "completed" || orderStatus === "delivered";
  
  if (isPaid) {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      icon: <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />,
      text: "Paid",
    };
  }
  
  return {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80",
    icon: <Clock size={13} className="text-amber-600 shrink-0" />,
    text: "Pending",
  };
};

const getInventoryBadge = (orderStatus) => {
  // If order is completed or delivered, inventory is finished, otherwise pending
  const isFinished = orderStatus === "completed" || orderStatus === "delivered" || orderStatus === "completedprocess";
  
  if (isFinished) {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      icon: <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />,
      text: "Completed",
    };
  }
  
  return {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80",
    icon: <Clock size={13} className="text-amber-600 shrink-0" />,
    text: "Pending",
  };
};

const OrderTable = ({ orders, loadingOrders, handleOrderClick, confirmDelete }) => {
  if (loadingOrders) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-white border border-neutral-200/80 rounded-xl shadow-sm">
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
            <tr className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 text-xs font-semibold uppercase tracking-wider select-none">
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
          <tbody className="divide-y divide-neutral-100 text-sm">
            {orders?.map((order) => {
              const statusBadge = getStatusBadge(order?.status);
              const billingBadge = getBillingBadge(order?.paymentMethod, order?.status);
              const inventoryBadge = getInventoryBadge(order?.status);
              
              // Calculate total goj
              const totalGojVal = order?.totalGoj !== null && order?.totalGoj !== undefined
                ? order?.totalGoj
                : order?.tableData && order?.tableData.length > 0
                  ? order.tableData.reduce((sum, item) => sum + (item.goj || 0), 0)
                  : 0;

              return (
                <tr
                  key={order?._id}
                  className="hover:bg-neutral-50/50 cursor-pointer transition-colors duration-150 group"
                  onClick={() => handleOrderClick(order?._id)}
                >
                  {/* Order ID */}
                  <td className="px-6 py-4 font-semibold text-neutral-900 whitespace-nowrap">
                    <span className="text-neutral-500 font-medium mr-0.5">#</span>
                    {order?.orderId?.replace(/^#?ord-/, "") || order?._id?.slice(-6)}
                  </td>
                  
                  {/* Customer */}
                  <td className="px-6 py-4 font-medium text-neutral-800 whitespace-nowrap">
                    {order?.companyName || "N/A"}
                  </td>
                  
                  {/* Product (Cloth Type and Quality) with Figma Icons */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-neutral-800 font-medium">
                        <ShoppingBag size={13} className="text-neutral-400" />
                        <span>{order?.clotheType || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-normal">
                        <Hash size={12} className="text-neutral-300" />
                        <span>{order?.quality || "N/A"}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge.bg}`}
                    >
                      {statusBadge.icon}
                      <span className="capitalize">{statusBadge.text}</span>
                    </span>
                  </td>

                  {/* Total Goj (Neutral Pill Badge) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {totalGojVal} goj
                    </span>
                  </td>

                  {/* Billing Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${billingBadge.bg}`}
                    >
                      {billingBadge.icon}
                      <span>{billingBadge.text}</span>
                    </span>
                  </td>

                  {/* Inventory Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${inventoryBadge.bg}`}
                    >
                      {inventoryBadge.icon}
                      <span>{inventoryBadge.text}</span>
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
                        <Trash2 size={15} />
                      </button>
                      <div className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                        <MoreVertical size={15} />
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
