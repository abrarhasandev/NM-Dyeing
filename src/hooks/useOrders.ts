// @ts-nocheck
/**
 * useOrders — adapter over order list/detail APIs.
 *
 * Migrated to Convex for real-time reads.
 */

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useQuery, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import type {
  OrderChartBucket,
  OrderKpiData,
  OrderListFilters,
  OrderListItem,
  OrderPrevKpiData,
  OrdersListResponse,
} from "@/types/order";

const useOrders = (filters: OrderListFilters) => {
  const {
    currentPage,
    itemsPerPage,
    searchTerm,
    dateRange,
    customStartDate,
    customEndDate,
    exactDate,
    status,
    clotheType,
    finishingType,
    colour,
    sillName,
    quality,
    transporterName,
    isTrash,
    skip,
  } = filters;

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [kpiData, setKpiData] = useState<OrderKpiData | null>(null);
  const [prevKpiData, setPrevKpiData] = useState<OrderPrevKpiData | null>(null);
  const [chartData, setChartData] = useState<OrderChartBucket[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);

  const convex = useConvex();

  const resolveDateRange = () => {
    let startDate = "";
    let endDate = "";
    const today = dayjs();

    switch (dateRange) {
      case "current_year":
        startDate = today.startOf("year").toISOString();
        endDate = today.endOf("day").toISOString();
        break;
      case "3_months":
        startDate = today.subtract(3, "month").startOf("day").toISOString();
        endDate = today.endOf("day").toISOString();
        break;
      case "30_days":
        startDate = today.subtract(30, "day").startOf("day").toISOString();
        endDate = today.endOf("day").toISOString();
        break;
      case "7_days":
        startDate = today.subtract(7, "day").startOf("day").toISOString();
        endDate = today.endOf("day").toISOString();
        break;
      case "3_days":
        startDate = today.subtract(3, "day").startOf("day").toISOString();
        endDate = today.endOf("day").toISOString();
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate =
            customStartDate instanceof Date
              ? customStartDate.toISOString()
              : new Date(customStartDate).toISOString();
          endDate =
            customEndDate instanceof Date
              ? customEndDate.toISOString()
              : new Date(customEndDate).toISOString();
        }
        break;
      default:
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = resolveDateRange();

  const queryArgs = useMemo(() => {
    return {
      page: currentPage || 1,
      limit: itemsPerPage || 12,
      search: searchTerm || "",
      startDate: startDate || "",
      endDate: endDate || "",
      exactDate: exactDate || "",
      status: status || "",
      clotheTypes: clotheType || "",
      finishingType: finishingType || "",
      colour: colour || "",
      sillName: sillName || "",
      quality: quality || "",
      transporterName: transporterName || "",
      isTrash: isTrash || false,
    };
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    startDate,
    endDate,
    exactDate,
    status,
    clotheType,
    finishingType,
    colour,
    sillName,
    quality,
    transporterName,
    isTrash,
  ]);

  const convexData = useQuery(
    api.orderQueries.listOrdersWithStats,
    skip ? "skip" : queryArgs
  );

  useEffect(() => {
    if (convexData !== undefined) {
      setOrders(convexData.orders ?? []);
      setKpiData(convexData.kpiData ?? null);
      setPrevKpiData(convexData.prevKpiData ?? null);
      setChartData(convexData.chartData ?? []);
      setTotalPages(Math.ceil((convexData.totalCount || 0) / itemsPerPage) || 1);
      setLoadingOrders(false);
    } else if (!skip) {
      setLoadingOrders(true);
    }
  }, [convexData, skip, itemsPerPage]);

  const fetchOrders = async (silent = false) => {
    if (skip) return;
    if (!silent) setLoadingOrders(true);
    try {
      // Force a manual fetch if needed, though useQuery is reactive
      const data = await convex.query(api.orderQueries.listOrdersWithStats, queryArgs);
      setOrders(data.orders ?? []);
      setKpiData(data.kpiData ?? null);
      setPrevKpiData(data.prevKpiData ?? null);
      setChartData(data.chartData ?? []);
      setTotalPages(Math.ceil((data.totalCount || 0) / itemsPerPage) || 1);
    } catch (err) {
      console.error("Error fetching orders manually:", err);
      toast.error("Error fetching orders. Please try again.");
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const fetchSingleOrder = async (id: string) => {
    setLoadingOrder(true);
    try {
      const data = await convex.query(api.orderQueries.getOrderById, { id });
      if (!data) throw new Error("Order not found");
      setSelectedOrder(data);
      return data;
    } catch (err) {
      console.error("Error fetching single order:", err);
      toast.error("Error fetching order details.");
    } finally {
      setLoadingOrder(false);
    }
  };

  const deleteOrder = async (id: string, permanent = false) => {
    try {
      const url = permanent
        ? `/api/order/${id}?permanent=true`
        : `/api/order/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      // Convex is real-time, no need to manually fetchOrders unless we want to be absolutely sure
      // await fetchOrders(); 
      toast.success(
        permanent ? "Order permanently deleted." : "Order moved to trash."
      );
    } catch (err) {
      console.error(err);
      toast.error("Error deleting order. Please try again.");
    }
  };

  const restoreOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/order/${id}/restore`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore order");
      // await fetchOrders();
      toast.success("Order restored successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Error restoring order. Please try again.");
    }
  };

  return {
    orders,
    setOrders,
    kpiData,
    prevKpiData,
    chartData,
    totalPages,
    loadingOrders,
    loadingOrder,
    selectedOrder,
    setSelectedOrder,
    fetchSingleOrder,
    deleteOrder,
    restoreOrder,
    fetchOrders,
  };
};

export default useOrders;
