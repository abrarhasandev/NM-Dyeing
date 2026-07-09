"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OrderSideModal from "@/components/order/OrderSideModal";
import ConfirmationModal from "@/components/order/ConfirmationModal";
import OrderFilters from "@/components/order/OrderFilters";
import OrderTable from "@/components/order/OrderTable";
import PaginationControls from "@/components/order/PaginationControls";
import useAppData from "@/hook/useAppData";
import useOrders from "@/hook/useOrder";
import Link from "next/link";
import { toast } from "react-toastify";


const Orders = () => {
  const { data } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL থেকে orderId নেওয়া
  const orderIdFromUrl = searchParams.get("orderId");

  // States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [status, setStatus] = useState("");
  const [clotheType, setClotheType] = useState("");
  const [finishingType, setFinishingType] = useState("");
  const [colour, setColour] = useState("");
  const [sillName, setSillName] = useState("");
  const [quality, setQuality] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Debounced search — prevents a DB query on every keystroke
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isFiltersLoaded = useRef(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFilters = localStorage.getItem("orders_filters");
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm);
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
      setTimeout(() => {
        isFiltersLoaded.current = true;
      }, 0);
    }
  }, []);

  // Save filters to localStorage on change
  useEffect(() => {
    if (!isFiltersLoaded.current) return;

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
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Hook থেকে প্রয়োজনীয় ফাংশনগুলো নেওয়া
  const {
    orders,
    totalPages,
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
  });

  // --- Best Practice: URL-এ ID থাকলে অটোমেটিক ডাটা ফেচ করা ---
  useEffect(() => {
    if (orderIdFromUrl) {
      // শুধু একবারই ফেচ করবে যদি selectedOrder না থাকে বা ID আলাদা হয়
      if (!selectedOrder || selectedOrder._id !== orderIdFromUrl) {
        fetchSingleOrder(orderIdFromUrl);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [orderIdFromUrl, fetchSingleOrder, setSelectedOrder, selectedOrder]);

  // Handler: অর্ডারে ক্লিক করলে URL পরিবর্তন
  const handleOrderClick = useCallback((id) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderId", id);
    router.push(`/dashboard/order?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Handler: মোডাল ক্লোজ করলে URL ক্লিন করা
  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("orderId");
    router.push(`/dashboard/order?${params.toString()}`, { scroll: false });
    setSelectedOrder(null);
  }, [router, searchParams, setSelectedOrder]);

  const confirmDelete = (id) => {
    setOrderToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    await deleteOrder(orderToDelete);
    setShowConfirmModal(false);
    if (orderIdFromUrl === orderToDelete) {
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
  return (
    <div
      className="relative text-black"
      style={{
        fontFamily: "var(--mn-font-primary)",
        paddingTop: "0",
      }}
    >
      {/* ── Page Header Bar — Figma: 1068×64, gap 10, breadcrumb pill ── */}
      <div
        className="flex items-center justify-between sticky top-0 z-10 bg-white border-b mt-10 md:mt-0"
        style={{
          minHeight: "64px",
          padding: "0 0",
          borderColor: "var(--mn-surface)",
          boxShadow: "var(--mn-elevation-1)",
        }}
      >
        {/* Breadcrumb pill — Figma: Frame 24, 235×28, padding 0/16 */}
        <div
          className="flex items-center gap-2 text-[13px] font-medium"
          style={{ padding: "0 24px", color: "var(--mn-text-primary)" }}
        >
          <span style={{ color: "var(--mn-text-tertiary)" }}>Dashboard</span>
          <span style={{ color: "var(--mn-text-tertiary)" }}>/</span>
          <span
            className="font-semibold"
            style={{ color: "var(--mn-accent)" }}
          >
            Orders
          </span>
        </div>

        {/* New Order CTA */}
        <div style={{ padding: "0 24px" }}>
          <Link
            href="/dashboard/createOrder"
            id="new-order-btn"
            className="inline-flex items-center gap-1.5 text-white text-[13px] font-semibold transition-all duration-150 active:scale-95"
            style={{
              backgroundColor: "var(--mn-accent)",
              borderRadius: "var(--mn-radius-md)",
              padding: "8px 16px",
              boxShadow: "var(--mn-elevation-1)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-accent-4)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-accent)")}
          >
            <span className="text-[16px] font-bold leading-none">+</span>
            New Order
          </Link>
        </div>
      </div>

      {/* ── Main Content — Figma: Frame 28, padding 24/0/24/0, gap 24 ── */}
      <div
        className="flex flex-col"
        style={{ padding: "24px 0", gap: "16px" }}
      >
        {/* Wrapper — Figma: padding 0/24/0/24 */}
        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <OrderFilters
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            dateRange={dateRange} handleDateRangeChange={setDateRange}
            customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
            handleCustomApply={handleCustomApply}
            status={status} setStatus={setStatus}
            clotheType={clotheType} setClotheType={setClotheType}
            finishingType={finishingType} setFinishingType={setFinishingType}
            colour={colour} setColour={setColour}
            sillName={sillName} setSillName={setSillName}
            quality={quality} setQuality={setQuality}
            showMoreFilters={showMoreFilters} setShowMoreFilters={setShowMoreFilters}
            data={data}
          />

          <OrderTable
            orders={orders}
            handleOrderClick={handleOrderClick}
            confirmDelete={confirmDelete}
          />

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
        </div>
      </div>

      {/* Side Modal */}
      <OrderSideModal
        isModalOpen={!!orderIdFromUrl}
        loadingOrder={loadingOrder}
        selectedOrder={selectedOrder}
        closeModal={closeModal}
        confirmDelete={confirmDelete}
      />

      <ConfirmationModal
        showConfirmModal={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Orders;