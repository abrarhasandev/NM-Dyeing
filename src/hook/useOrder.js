/**
 * useOrders — fetches paginated orders + server-computed stats.
 *
 * API response shape (new):
 * {
 *   orders:       Order[]       — paginated rows
 *   totalCount:   number
 *   kpiData:      { totalOrders, totalGoj, uniqueCustomers, activeCount, activeGoj }
 *   prevKpiData:  { totalOrders, totalGoj }
 *   chartData:    { _id: { year, month, day, clothCat }, count }[]
 * }
 *
 * The previous allFilteredOrders (unbounded raw documents) is GONE.
 * All aggregation now happens server-side inside a MongoDB $facet pipeline.
 */

import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const useOrders = (filters) => {
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
    skip,
  } = filters;

  const [orders,       setOrders]       = useState([]);
  const [kpiData,      setKpiData]      = useState(null);       // server-computed KPIs
  const [prevKpiData,  setPrevKpiData]  = useState(null);       // previous-period KPIs
  const [chartData,    setChartData]    = useState([]);         // server-computed chart buckets
  const [totalPages,   setTotalPages]   = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOrder,  setLoadingOrder]  = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const lastRequestId = useRef(0);

  // ── Build date range ISO strings from the dateRange selector ─────────────
  const resolveDateRange = () => {
    let startDate = "";
    let endDate   = "";
    const today   = dayjs();

    switch (dateRange) {
      case "current_year":
        startDate = today.startOf("year").toISOString();
        endDate   = today.endOf("day").toISOString();
        break;
      case "3_months":
        startDate = today.subtract(3, "month").startOf("day").toISOString();
        endDate   = today.endOf("day").toISOString();
        break;
      case "30_days":
        startDate = today.subtract(30, "day").startOf("day").toISOString();
        endDate   = today.endOf("day").toISOString();
        break;
      case "7_days":
        startDate = today.subtract(7, "day").startOf("day").toISOString();
        endDate   = today.endOf("day").toISOString();
        break;
      case "3_days":
        startDate = today.subtract(3, "day").startOf("day").toISOString();
        endDate   = today.endOf("day").toISOString();
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = customStartDate instanceof Date
            ? customStartDate.toISOString()
            : new Date(customStartDate).toISOString();
          endDate = customEndDate instanceof Date
            ? customEndDate.toISOString()
            : new Date(customEndDate).toISOString();
        }
        break;
      default:
        break;
    }

    return { startDate, endDate };
  };

  // ── Main fetch ────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    if (skip) return;
    setLoadingOrders(true);
    const requestId = ++lastRequestId.current;

    const { startDate, endDate } = resolveDateRange();

    try {
      const params = new URLSearchParams({
        page:      currentPage.toString(),
        limit:     itemsPerPage.toString(),
        search:    searchTerm || "",
        startDate: startDate  || "",
        endDate:   endDate    || "",
      });

      if (exactDate)     params.append("date",         exactDate);
      if (status)        params.append("status",        status);
      if (clotheType)    params.append("clotheTypes",   clotheType);
      if (finishingType) params.append("finishingType", finishingType);
      if (colour)        params.append("colour",        colour);
      if (sillName)      params.append("sillName",      sillName);
      if (quality)       params.append("quality",       quality);

      const res = await fetch(`/api/order?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");

      const {
        orders:      fetchedOrders,
        totalCount,
        kpiData:     fetchedKpi,
        prevKpiData: fetchedPrevKpi,
        chartData:   fetchedChart,
      } = await res.json();

      if (requestId === lastRequestId.current) {
        setOrders(fetchedOrders       ?? []);
        setKpiData(fetchedKpi         ?? null);
        setPrevKpiData(fetchedPrevKpi ?? null);
        setChartData(fetchedChart     ?? []);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      }
    } catch (err) {
      if (requestId === lastRequestId.current) {
        console.error("Error fetching orders:", err);
        toast.error("Error fetching orders. Please try again.");
      }
    } finally {
      if (requestId === lastRequestId.current) {
        setLoadingOrders(false);
      }
    }
  };

  // ── Fetch single order by ID ──────────────────────────────────────────────
  const fetchSingleOrder = async (id) => {
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

  // ── Delete order then refresh list ────────────────────────────────────────
  const deleteOrder = async (id) => {
    try {
      const res = await fetch(`/api/order/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      await fetchOrders();
      toast.success("Order deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting order. Please try again.");
    }
  };

  // ── Re-fetch whenever any filter changes ─────────────────────────────────
  useEffect(() => {
    fetchOrders();
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
  ]);

  return {
    orders,
    setOrders,
    // New server-computed data (replaces allFilteredOrders + prevFilteredOrders)
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
    fetchOrders,
  };
};

export default useOrders;
