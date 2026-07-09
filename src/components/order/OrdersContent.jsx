"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Layers,
  Activity,
  ChevronRight,
  LayoutGrid,
  Menu
} from "lucide-react";
import OrderSideModal from "@/components/order/OrderSideModal";
import ConfirmationModal from "@/components/order/ConfirmationModal";
import OrderFilters from "@/components/order/OrderFilters";
import OrderTable from "@/components/order/OrderTable";
import PaginationControls from "@/components/order/PaginationControls";
import OrderSkeleton from "@/components/order/OrderSkeleton";
import useAppData from "@/hook/useAppData";
import useOrders from "@/hook/useOrder";
import dayjs from "dayjs";
import { toast } from "react-toastify";

// Import Recharts & Shadcn Chart UI
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const OrdersContent = () => {
  const { data } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("id");

  // States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("3_months"); // Default to 3 months as per Figma
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [status, setStatus] = useState("");
  const [clotheType, setClotheType] = useState("");
  const [finishingType, setFinishingType] = useState("");
  const [colour, setColour] = useState("");
  const [sillName, setSillName] = useState("");
  const [quality, setQuality] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showGraph, setShowGraph] = useState(true);

  // Track whether the very first data fetch has resolved
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFilters = localStorage.getItem("orders_filters");
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          if (parsed.searchTerm !== undefined) {
            setSearchTerm(parsed.searchTerm);
            setDebouncedSearchTerm(parsed.searchTerm);
          }
          if (parsed.dateRange !== undefined) setDateRange(parsed.dateRange);
          if (parsed.customStartDate !== undefined) setCustomStartDate(parsed.customStartDate ? new Date(parsed.customStartDate) : null);
          if (parsed.customEndDate !== undefined) setCustomEndDate(parsed.customEndDate ? new Date(parsed.customEndDate) : null);
          if (parsed.status !== undefined) setStatus(parsed.status);
          if (parsed.clotheType !== undefined) setClotheType(parsed.clotheType);
          if (parsed.finishingType !== undefined) setFinishingType(parsed.finishingType);
          if (parsed.colour !== undefined) setColour(parsed.colour);
          if (parsed.sillName !== undefined) setSillName(parsed.sillName);
          if (parsed.quality !== undefined) setQuality(parsed.quality);
          if (parsed.showMoreFilters !== undefined) setShowMoreFilters(parsed.showMoreFilters);
          if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
          if (parsed.itemsPerPage !== undefined) setItemsPerPage(parsed.itemsPerPage);
        } catch (e) {
          console.error("Failed to parse orders_filters from localStorage", e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Save filters to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;

    const filtersToSave = {
      searchTerm,
      dateRange,
      customStartDate: customStartDate ? customStartDate.toISOString() : null,
      customEndDate: customEndDate ? customEndDate.toISOString() : null,
      status,
      clotheType,
      finishingType,
      colour,
      sillName,
      quality,
      showMoreFilters,
      currentPage,
      itemsPerPage,
    };
    localStorage.setItem("orders_filters", JSON.stringify(filtersToSave));
  }, [
    isInitialized,
    searchTerm,
    dateRange,
    customStartDate,
    customEndDate,
    status,
    clotheType,
    finishingType,
    colour,
    sillName,
    quality,
    showMoreFilters,
    currentPage,
    itemsPerPage,
  ]);

  // Load showGraph preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedShowGraph = localStorage.getItem("showGraph");
      if (savedShowGraph !== null) {
        setShowGraph(savedShowGraph === "true");
      }
    }
  }, []);

  // Persistent toggle wrapper
  const handleToggleGraph = (value) => {
    setShowGraph(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("showGraph", String(value));
    }
  };

  // Search input reference for Ctrl+K shortcut focus
  const searchInputRef = useRef(null);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Keyboard shortcut Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector("input[placeholder*='Search order']");
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const {
    orders,
    setOrders,
    kpiData,
    prevKpiData,
    chartData: rawChartBuckets,
    totalPages,
    loadingOrders,
    loadingOrder,
    selectedOrder,
    setSelectedOrder,
    fetchSingleOrder,
    deleteOrder,
  } = useOrders({
    currentPage,
    itemsPerPage,
    searchTerm: debouncedSearchTerm,
    dateRange,
    customStartDate,
    customEndDate,
    status,
    clotheType,
    finishingType,
    colour,
    sillName,
    quality,
    skip: !isInitialized,
  });

  // Mark initial load complete once loadingOrders transitions false for the first time
  React.useEffect(() => {
    if (!loadingOrders && isInitialized && !initialLoaded) {
      setInitialLoaded(true);
    }
  }, [loadingOrders, isInitialized, initialLoaded]);

  // URL-e ID thakle seta auto load hobe (Refresh korle kaj korbe)
  useEffect(() => {
    if (orderIdFromUrl) {
      fetchSingleOrder(orderIdFromUrl);
    } else {
      setSelectedOrder(null);
    }
  }, [orderIdFromUrl]);

  // Handlers
  const handleOrderClick = (id) => {
    router.push(`/dashboard/order?id=${id}`, { scroll: false });
  };

  const closeModal = () => {
    setSelectedOrder(null);
    router.push("/dashboard/order", { scroll: false });
  };

  const confirmDelete = (id) => {
    setOrderToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    await deleteOrder(orderToDelete);
    setShowConfirmModal(false);
    setOrderToDelete(null);
    if (selectedOrder && selectedOrder._id === orderToDelete) {
      closeModal();
    }
  };

  const handleCustomApply = (startDate, endDate) => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end date");
      return;
    }
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // KPI calculations
  // Dynamic Date range text for the chart footer
  const chartDateRangeText = useMemo(() => {
    const today = dayjs();
    let start = today.subtract(3, "month");
    let end = today;

    if (dateRange === "3_days") {
      start = today.subtract(3, "day");
      return `${start.format("MMMM D")} - ${end.format("MMMM D, YYYY")}`;
    } else if (dateRange === "7_days") {
      start = today.subtract(7, "day");
      return `${start.format("MMMM D")} - ${end.format("MMMM D, YYYY")}`;
    } else if (dateRange === "30_days") {
      start = today.subtract(30, "day");
      return `${start.format("MMMM D")} - ${end.format("MMMM D, YYYY")}`;
    } else if (dateRange === "3_months") {
      start = today.subtract(3, "month");
      return `${start.format("MMMM")} - ${end.format("MMMM YYYY")}`;
    } else if (dateRange === "current_year") {
      start = today.startOf("year");
      return `${start.format("MMMM")} - ${end.format("MMMM YYYY")}`;
    } else if (dateRange === "custom" && customStartDate && customEndDate) {
      start = dayjs(customStartDate);
      end = dayjs(customEndDate);
      return `${start.format("MMMM D, YYYY")} - ${end.format("MMMM D, YYYY")}`;
    }
    return `${start.format("MMMM")} - ${end.format("MMMM YYYY")}`;
  }, [dateRange, customStartDate, customEndDate]);

  // Dynamic Chart description text
  const chartDescriptionText = useMemo(() => {
    switch (dateRange) {
      case "3_days": return "Last 3 days";
      case "7_days": return "Last 7 days";
      case "30_days": return "Last 30 days";
      case "3_months": return "Last 3 months";
      case "current_year": return "Current year";
      case "custom": return "Custom date range";
      default: return "Showing total order categories distribution";
    }
  }, [dateRange]);

  // ── Helper: date-range label text ─────────────────────────────────────────
  const getDateRangeLabel = (range) => {
    switch (range) {
      case "3_days":       return "last 3 days";
      case "7_days":       return "last 7 days";
      case "30_days":      return "last 30 days";
      case "3_months":     return "last 3 months";
      case "current_year": return "current year";
      case "custom":       return "custom range";
      default:             return "selected range";
    }
  };

  // ── KPI stats — now derived from server-computed kpiData / prevKpiData ──────
  // No client-side iteration over raw documents.
  const stats = useMemo(() => {
    const cur  = kpiData     ?? { totalOrders: 0, totalGoj: 0, uniqueCustomers: 0, activeCount: 0, activeGoj: 0 };
    const prev = prevKpiData ?? { totalOrders: 0, totalGoj: 0 };

    let orderCountGrowth = 0;
    if (prev.totalOrders > 0) {
      orderCountGrowth = ((cur.totalOrders - prev.totalOrders) / prev.totalOrders) * 100;
    } else if (cur.totalOrders > 0) {
      orderCountGrowth = 100;
    }

    let gojGrowth = 0;
    if (prev.totalGoj > 0) {
      gojGrowth = ((cur.totalGoj - prev.totalGoj) / prev.totalGoj) * 100;
    } else if (cur.totalGoj > 0) {
      gojGrowth = 100;
    }

    return {
      totalOrders:      cur.totalOrders,
      totalGoj:         cur.totalGoj,
      totalCustomers:   cur.uniqueCustomers,
      activeCount:      cur.activeCount,
      activeGoj:        cur.activeGoj,
      orderCountGrowth,
      gojGrowth,
    };
  }, [kpiData, prevKpiData]);

  // ── Chart data — reshape server-computed buckets into Recharts format ───────
  // rawChartBuckets: { _id: { year, month, day, clothCat }, count }[]
  // We need to produce: { month: "Jan", cotton: N, silk: N, other: N }[]
  const chartData = useMemo(() => {
    if (!rawChartBuckets || rawChartBuckets.length === 0) return [];

    // Determine grouping based on date range
    const today = dayjs();
    let grouping = "month";
    let start = today.subtract(3, "month");
    let end   = today;

    if (dateRange === "3_days" || dateRange === "7_days" || dateRange === "30_days") {
      grouping = "day";
      const nDays = dateRange === "3_days" ? 3 : dateRange === "7_days" ? 7 : 30;
      start = today.subtract(nDays, "day");
    } else if (dateRange === "current_year") {
      grouping = "month";
      start = today.startOf("year");
    } else if (dateRange === "custom" && customStartDate && customEndDate) {
      start = dayjs(customStartDate);
      end   = dayjs(customEndDate);
      grouping = end.diff(start, "day") <= 31 ? "day" : "month";
    }

    // Generate empty period slots
    const periods = [];
    if (grouping === "day") {
      const diffDays = Math.min(end.diff(start, "day"), 31);
      for (let i = 0; i <= diffDays; i++) {
        const d = start.add(i, "day");
        periods.push({ key: d.format("YYYY-MM-DD"), month: d.format("MMM D"), cotton: 0, silk: 0, other: 0 });
      }
    } else {
      const diffMonths = Math.min(end.diff(start, "month"), 60);
      for (let i = 0; i <= diffMonths; i++) {
        const m = start.add(i, "month");
        const label = dateRange === "3_months" ? m.format("MMMM") : m.format("MMM YY");
        periods.push({ key: m.format("YYYY-MM"), month: label, cotton: 0, silk: 0, other: 0 });
      }
    }

    // Map server buckets into the period slots
    for (const bucket of rawChartBuckets) {
      const { year, month, day, clothCat } = bucket._id;
      const key = grouping === "day"
        ? dayjs(new Date(year, month - 1, day)).format("YYYY-MM-DD")
        : dayjs(new Date(year, month - 1, 1)).format("YYYY-MM");
      const period = periods.find(p => p.key === key);
      if (period && clothCat in period) {
        period[clothCat] += bucket.count;
      }
    }

    return periods;
  }, [rawChartBuckets, dateRange, customStartDate, customEndDate]);

  // Recharts color and label configuration
  const chartConfig = {
    cotton: {
      label: "Cotton",
      color: "#2563eb", // Deep blue
    },
    silk: {
      label: "Silk",
      color: "#38bdf8", // Sky blue
    },
    other: {
      label: "Other",
      color: "#a5b4fc", // Lavender/Light purple
    },
  };

  // Show skeleton on the very first load (before any data has arrived)
  const isInitialLoading = !initialLoaded && (loadingOrders || !isInitialized);

  if (isInitialLoading) {
    return (
      <div
        style={{
          animation: "mn-content-fade-in 0.3s ease",
        }}
      >
        <style>{`@keyframes mn-content-fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        <OrderSkeleton showGraph={showGraph} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-5 text-[#09090B] select-none py-2 pb-10"
      style={{ animation: "mn-content-fade-in 0.4s ease" }}
    >

      {/* Breadcrumb / Top Title Bar */}
      <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
        <div className="flex items-center gap-2 text-sm text-[#71717A] font-medium">
          <span>Dashboard</span>
          <ChevronRight size={14} className="text-[#A1A1AA]" />
          <span className="text-[#09090B] font-semibold">Orders</span>
        </div>
        <Link
          href="/dashboard/createOrder"
          className="inline-flex items-center justify-center gap-1.5 bg-[#09090B] hover:bg-[#27272A] text-white text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={14} /> New Order
        </Link>
      </div>

      {/* KPI Stats Cards & Chart Section (Collapsible) */}
      {showGraph && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Orders */}
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] hover:border-[#D4D4D8] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[13px] font-medium text-[#71717A]">Total Orders</span>
                {(() => {
                  const val = stats.orderCountGrowth;
                  if (val > 0) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] text-[11px] font-semibold border border-[#BBF7D0]">
                        <TrendingUp size={10} /> +{val.toFixed(1)}%
                      </span>
                    );
                  } else if (val < 0) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold border border-[#FECACA]">
                        <TrendingDown size={10} /> {val.toFixed(1)}%
                      </span>
                    );
                  } else {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#71717A] text-[11px] font-semibold border border-[#E4E4E7]">
                        0.0%
                      </span>
                    );
                  }
                })()}
              </div>
              <div className="flex flex-col mt-1">
                <span className="text-[22px] font-bold text-[#09090B] leading-none">
                  {stats.totalOrders.toLocaleString()} <span className="text-[14px] font-semibold text-[#71717A]">orders</span>
                </span>
                <span className="text-[12px] font-medium text-[#71717A] mt-1.5 leading-none">
                  {stats.totalGoj.toLocaleString()} goj total
                </span>
                <span className="text-[11px] text-[#A1A1AA] mt-1.5 font-medium">
                  Orders in {getDateRangeLabel(dateRange)}
                </span>
              </div>
            </div>

            {/* Card 2: Total Customers */}
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] hover:border-[#D4D4D8] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[13px] font-medium text-[#71717A]">Total Customers</span>
                <Users size={15} className="text-[#A1A1AA]" />
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[22px] font-bold text-[#09090B]">{stats.totalCustomers}</span>
                <span className="text-[11px] text-[#A1A1AA] mt-1.5 font-medium">
                  Customers in {getDateRangeLabel(dateRange)}
                </span>
              </div>
            </div>

            {/* Card 3: Active Orders */}
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] hover:border-[#D4D4D8] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[13px] font-medium text-[#71717A]">Active Orders</span>
                <Activity size={15} className="text-[#A1A1AA]" />
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[16px] font-bold text-[#09090B] leading-tight">
                  {stats.activeCount} active
                </span>
                <span className="text-[12px] font-medium text-[#71717A] mt-0.5">{stats.activeGoj.toLocaleString()} goj</span>
                <span className="text-[11px] text-[#A1A1AA] mt-1.5 font-medium">In-progress orders</span>
              </div>
            </div>

            {/* Card 4: Growth Rate */}
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] hover:border-[#D4D4D8] transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[13px] font-medium text-[#71717A]">Growth Rate</span>
                {(() => {
                  const val = stats.gojGrowth;
                  if (val > 0) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] text-[11px] font-semibold border border-[#BBF7D0]">
                        <TrendingUp size={10} /> +{val.toFixed(1)}%
                      </span>
                    );
                  } else if (val < 0) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold border border-[#FECACA]">
                        <TrendingDown size={10} /> {val.toFixed(1)}%
                      </span>
                    );
                  } else {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#71717A] text-[11px] font-semibold border border-[#E4E4E7]">
                        0.0%
                      </span>
                    );
                  }
                })()}
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[22px] font-bold text-[#09090B]">
                  {stats.gojGrowth >= 0 ? "+" : ""}{stats.gojGrowth.toFixed(1)}%
                </span>
                <span className="text-[11px] text-[#A1A1AA] mt-1.5 font-medium">
                  {stats.gojGrowth >= 0 ? "Meets growth projections" : "Below growth projections"}
                </span>
              </div>
            </div>
          </div>

          <Card className="border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b border-[#E4E4E7] py-4 sm:flex-row">
              <div className="grid flex-1 gap-0.5">
                <CardTitle className="text-[14px] font-bold text-[#09090B]">Order Chart</CardTitle>
                <CardDescription className="text-[11px] text-[#A1A1AA] font-medium">
                  {chartDescriptionText}
                </CardDescription>
              </div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger
                  className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                  aria-label="Select a value"
                >
                  <SelectValue placeholder="Last 3 months" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white border border-neutral-200 shadow-md">
                  <SelectItem value="3_days" className="rounded-lg">
                    Last 3 days
                  </SelectItem>
                  <SelectItem value="7_days" className="rounded-lg">
                    Last 7 days
                  </SelectItem>
                  <SelectItem value="30_days" className="rounded-lg">
                    Last 30 days
                  </SelectItem>
                  <SelectItem value="3_months" className="rounded-lg">
                    Last 3 months
                  </SelectItem>
                  <SelectItem value="current_year" className="rounded-lg">
                    Current year
                  </SelectItem>
                  <SelectItem value="custom" className="rounded-lg">
                    Custom range
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              {chartData.length >= 2 ? (
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[250px] w-full"
                >
                  <AreaChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                    }}
                  >
                    <defs>
                      <linearGradient id="fillCotton" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-cotton)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-cotton)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient id="fillSilk" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-silk)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-silk)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient id="fillOther" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-other)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-other)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        if (typeof value === "string") {
                          if (value.includes(" ")) {
                            return value;
                          }
                          return value.slice(0, 3);
                        }
                        return value;
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return value;
                          }}
                          indicator="dot"
                        />
                      }
                    />
                    <Area
                      dataKey="other"
                      type="monotone"
                      fill="url(#fillOther)"
                      stroke="var(--color-other)"
                      stackId="a"
                    />
                    <Area
                      dataKey="silk"
                      type="monotone"
                      fill="url(#fillSilk)"
                      stroke="var(--color-silk)"
                      stackId="a"
                    />
                    <Area
                      dataKey="cotton"
                      type="monotone"
                      fill="url(#fillCotton)"
                      stroke="var(--color-cotton)"
                      stackId="a"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                // Fallback State when no data is available
                <div className="flex flex-col items-center justify-center text-center p-6 bg-[#FAFAFA] border border-[#F4F4F5] rounded-lg w-full h-[250px]">
                  <span className="text-[#71717A] font-bold text-[13px]">No data available in this range</span>
                  <span className="text-[11px] text-[#A1A1AA] mt-1 max-w-[280px]">There are no orders matching this filter segment to plot visual stats.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Filter and Control Bar */}
      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateRange={dateRange}
        handleDateRangeChange={setDateRange}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        handleCustomApply={handleCustomApply}
        status={status}
        setStatus={setStatus}
        clotheType={clotheType}
        setClotheType={setClotheType}
        finishingType={finishingType}
        setFinishingType={setFinishingType}
        colour={colour}
        setColour={setColour}
        sillName={sillName}
        setSillName={setSillName}
        quality={quality}
        setQuality={setQuality}
        showMoreFilters={showMoreFilters}
        setShowMoreFilters={setShowMoreFilters}
        data={data}
        showGraph={showGraph}
        setShowGraph={handleToggleGraph}
      />

      {/* Order Table list */}
      <OrderTable
        orders={orders}
        loadingOrders={loadingOrders}
        handleOrderClick={handleOrderClick}
        confirmDelete={confirmDelete}
      />

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />

      {/* Side Details Drawer */}
      <OrderSideModal
        isModalOpen={!!selectedOrder}
        loadingOrder={loadingOrder}
        selectedOrder={selectedOrder}
        closeModal={closeModal}
        confirmDelete={confirmDelete}
        setOrders={setOrders}
        setSelectedOrder={setSelectedOrder}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        showConfirmModal={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
