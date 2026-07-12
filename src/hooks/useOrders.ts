/**
 * useOrders — adapter over order list/detail APIs.
 *
 * Phase D skeleton: still Mongo via `/api/order*`.
 * Later cutover can swap implementation without touching list UI.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
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

  const lastRequestId = useRef(0);

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

  const fetchOrders = async (silent = false) => {
    if (skip) return;
    if (!silent) setLoadingOrders(true);
    const requestId = ++lastRequestId.current;

    const { startDate, endDate } = resolveDateRange();

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm || "",
        startDate: startDate || "",
        endDate: endDate || "",
      });

      if (exactDate) params.append("date", exactDate);
      if (status) params.append("status", status);
      if (clotheType) params.append("clotheTypes", clotheType);
      if (finishingType) params.append("finishingType", finishingType);
      if (colour) params.append("colour", colour);
      if (sillName) params.append("sillName", sillName);
      if (quality) params.append("quality", quality);
      if (transporterName) params.append("transporterName", transporterName);
      if (isTrash) params.append("isTrash", "true");

      const res = await fetch(`/api/order?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data: OrdersListResponse = await res.json();

      if (requestId === lastRequestId.current) {
        setOrders(data.orders ?? []);
        setKpiData(data.kpiData ?? null);
        setPrevKpiData(data.prevKpiData ?? null);
        setChartData(data.chartData ?? []);
        setTotalPages(Math.ceil((data.totalCount || 0) / itemsPerPage) || 1);
      }
    } catch (err) {
      if (requestId === lastRequestId.current) {
        console.error("Error fetching orders:", err);
        toast.error("Error fetching orders. Please try again.");
      }
    } finally {
      if (requestId === lastRequestId.current) {
        if (!silent) setLoadingOrders(false);
      }
    }
  };

  const fetchSingleOrder = async (id: string) => {
    setLoadingOrder(true);
    try {
      const res = await fetch(`/api/order/${id}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
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
      await fetchOrders();
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
      await fetchOrders();
      toast.success("Order restored successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Error restoring order. Please try again.");
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional filter deps
  }, [
    skip,
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
  ]);

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
