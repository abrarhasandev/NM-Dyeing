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

  const [orders, setOrders] = useState([]);
  const [allFilteredOrders, setAllFilteredOrders] = useState([]);
  const [prevFilteredOrders, setPrevFilteredOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const lastRequestId = useRef(0);

  const fetchOrders = async () => {
    if (skip) return;
    setLoadingOrders(true);
    const requestId = ++lastRequestId.current;
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
          startDate = customStartDate.toISOString();
          endDate = customEndDate.toISOString();
        }
        break;
      default:
        break;
    }

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        startDate,
        endDate,
      });

      if (exactDate) params.append("date", exactDate);
      if (status) params.append("status", status);
      if (clotheType) params.append("clotheTypes", clotheType);
      if (finishingType) params.append("finishingType", finishingType);
      if (colour) params.append("colour", colour);
      if (sillName) params.append("sillName", sillName);
      if (quality) params.append("quality", quality);

      const res = await fetch(`/api/order?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");

      const { orders: fetchedOrders, totalCount, allFilteredOrders: fetchedAllFiltered, prevFilteredOrders: fetchedPrevFiltered } = await res.json();
      
      if (requestId === lastRequestId.current) {
        setOrders(fetchedOrders);
        setAllFilteredOrders(fetchedAllFiltered || []);
        setPrevFilteredOrders(fetchedPrevFiltered || []);
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
      loadingOrder && setLoadingOrder(false);
    }
  };


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
    allFilteredOrders,
    setAllFilteredOrders,
    prevFilteredOrders,
    setPrevFilteredOrders,
    totalPages,
    loadingOrders,
    loadingOrder,
    selectedOrder,
    setSelectedOrder,
    fetchSingleOrder,
    deleteOrder,
  };
};

export default useOrders;
