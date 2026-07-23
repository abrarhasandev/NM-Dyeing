// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import React, {
  useEffect,
  useState,
  use,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { toast } from "sonner";

import SaveInvoiceModal from "@/components/SaveInvoiceModal";
import CustomerSavedBillsTab from "@/components/customer/CustomerSavedBillsTab";
import InitialAmountModal from "@/components/customer/InitialAmountModal";
import CloseModal from "@/components/customer/CloseModal";
import LedgerTable from "@/components/customer/LedgerTable";
import SummaryFooter from "@/components/customer/SummaryFooter";
import { buildLedger, fmtDate } from "@/components/customer/ledgerUtils";
import LedgerPrint from "@/components/Print/ledger/LedgerPrint";
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  Lock,
  Pencil,
  Printer,
  MoreVertical,
  BookOpen,
  Receipt,
  Building2,
  Phone,
  MapPin,
  User,
  BadgeCheck,
} from "lucide-react";

export default function CustomerProfileLedger({ params }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams?.customerId;
  const router = useRouter();

  const [selectedView, setSelectedView] = useState("current");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [showInitialModal, setShowInitialModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const printRef = useRef(null);

  const [customer, setCustomer] = useState(null);
  const [currentLedger, setCurrentLedger] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [initialCharge, setInitialCharge] = useState(0);
  const [initialPayment, setInitialPayment] = useState(0);
  const [initialDate, setInitialDate] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotCache, setSnapshotCache] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSavingSelected, setIsSavingSelected] = useState(false);
  const [activeTab, setActiveTab] = useState("ledger");

  const fetchCurrentLedger = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/customers/ledger/${customerId}?_t=${Date.now()}`
      );
      const result = await res.json();
      if (result.success) {
        const {
          customer: c,
          billings,
          payments,
          openingBalance: ob = 0,
          initialCharge: ic = 0,
          initialPayment: ip = 0,
          initialDate: id = null,
          savedRecordIds = [],
        } = result.data;
        setCustomer(c);
        setOpeningBalance(ob);
        setInitialCharge(ic);
        setInitialPayment(ip);
        setInitialDate(id);
        setCurrentLedger(
          buildLedger(billings, payments, ob, ic, ip, savedRecordIds)
        );
      }
    } catch {
      toast.error("Failed to load ledger");
    }
  }, [customerId]);

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/customers/ledger/${customerId}/snapshots?_t=${Date.now()}`
      );
      const result = await res.json();
      if (result.success) setSnapshots(result.snapshots);
    } catch {
      toast.error("Failed to load snapshots");
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;
    Promise.all([fetchCurrentLedger(), fetchSnapshots()]).finally(() =>
      setPageLoading(false)
    );
  }, [customerId, fetchCurrentLedger, fetchSnapshots]);

  const loadSnapshot = useCallback(
    async (snapshotId) => {
      if (snapshotCache[snapshotId]) return;
      try {
        const res = await fetch(
          `/api/customers/ledger/${customerId}/snapshots/${snapshotId}?_t=${Date.now()}`
        );
        const result = await res.json();
        if (result.success)
          setSnapshotCache((prev) => ({
            ...prev,
            [snapshotId]: result.snapshot,
          }));
      } catch {
        toast.error("Failed to load snapshot");
      }
    },
    [customerId, snapshotCache]
  );

  useEffect(() => {
    if (selectedView !== "current") loadSnapshot(selectedView);
  }, [selectedView, loadSnapshot]);

  const handleSaveSelected = async (title, saveMode) => {
    if (!selectedRows.length) return;

    let payloadRecords = selectedRows.map((row) => ({
      ...row,
      clothType: row.clothType || "—",
      quality: row.quality || "—",
      colour: row.colour || "—",
      sillName: row.sillName || "—",
      finishingType: row.finishingType || "—",
    }));

    if (saveMode === "ledger") {
      try {
        const invRes = await fetch(
          `/api/customers/ledger/${customerId}/saved-invoices?view=${selectedView}&_t=${Date.now()}`
        );
        const invData = await invRes.json();
        const savedInvoices = invData.success ? invData.invoices : [];

        let bal = 0;
        let foundBalance = false;
        let prevInvoiceDesc = "";
        let prevInvoiceDate = null;

        if (savedInvoices.length > 0) {
          const sortedInvoices = savedInvoices.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
          const lastInvoice = sortedInvoices[0];

          if (lastInvoice.records && lastInvoice.records.length > 0) {
            const recordWithBalance = [...lastInvoice.records]
              .reverse()
              .find((r) => r.balance !== undefined && r.balance !== null);
            if (recordWithBalance) {
              bal = recordWithBalance.balance;
              foundBalance = true;
              prevInvoiceDesc = ` (${lastInvoice.invoiceNumber} — ${lastInvoice.title || "Invoice"})`;
              prevInvoiceDate = lastInvoice.createdAt;
            }
          }
        }

        if (foundBalance) {
          let prevDueAmt = 0;
          let isCharge = true;

          if (bal < 0) {
            prevDueAmt = Math.abs(bal);
            isCharge = true;
          } else if (bal > 0) {
            prevDueAmt = bal;
            isCharge = false;
          }

          if (prevDueAmt > 0) {
            payloadRecords.unshift({
              date: prevInvoiceDate || new Date().toISOString(),
              description:
                (isCharge
                  ? "Previous Due"
                  : "Previous Ledger Balance (Payment)") + prevInvoiceDesc,
              charge: isCharge ? prevDueAmt : 0,
              payment: isCharge ? 0 : prevDueAmt,
              provider: "SYSTEM",
              type: isCharge ? "debit" : "credit",
              companyName: customer?.companyName || "—",
              clothType: "—",
              quality: "—",
              colour: "—",
              sillName: "—",
              finishingType: "—",
            });
          }
        } else {
          if (initialCharge > 0 || initialPayment > 0) {
            payloadRecords.unshift({
              date: new Date().toISOString(),
              description:
                initialPayment > 0 && initialCharge === 0
                  ? "Previous Ledger Balance (Payment)"
                  : "Previous Ledger Balance / Due",
              charge: initialCharge > 0 ? initialCharge : 0,
              payment: initialPayment > 0 ? initialPayment : 0,
              provider: "SYSTEM",
              type: initialCharge > 0 ? "debit" : "credit",
              companyName: customer?.companyName || "—",
              clothType: "—",
              quality: "—",
              colour: "—",
              sillName: "—",
              finishingType: "—",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch previous due:", error);
      }
    }

    setIsSavingSelected(true);
    const totalCharge = payloadRecords.reduce((a, b) => a + (b.charge || 0), 0);
    const totalPayment = payloadRecords.reduce(
      (a, b) => a + (b.payment || 0),
      0
    );

    try {
      const res = await fetch(
        `/api/customers/ledger/${customerId}/saved-invoices`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            records: payloadRecords,
            totalCharge,
            totalPayment,
          }),
        }
      );
      const result = await res.json();
      if (result.success) {
        toast.success("Invoice সফলভাবে সেভ হয়েছে!");
        setSelectedRows([]);
        setShowSaveModal(false);
        await fetchCurrentLedger();
      } else {
        toast.error(result.message || "Failed to save selected bills");
      }
    } catch {
      toast.error("Server Error");
    } finally {
      setIsSavingSelected(false);
    }
  };

  const handleClose = async (title) => {
    setCloseLoading(true);
    try {
      const res = await fetch(`/api/customers/ledger/${customerId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Ledger সফলভাবে close হয়েছে!");
        setShowCloseModal(false);
        setSelectedView("current");
        setSnapshotCache({});
        await Promise.all([fetchCurrentLedger(), fetchSnapshots()]);
      } else {
        toast.error(result.message || "Close করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setCloseLoading(false);
    }
  };

  const handleSetInitialAmount = async (charge, payment, date) => {
    setInitialLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialCharge: charge,
          initialPayment: payment,
          initialDate: date,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Initial amount সেট হয়েছে!");
        setShowInitialModal(false);
        await fetchCurrentLedger();
      } else {
        toast.error(result.error || "সমস্যা হয়েছে");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      if (!printRef.current) return;
      const printArea = printRef.current.cloneNode(true);
      const tempDiv = document.createElement("div");
      tempDiv.className = "print-only";
      tempDiv.appendChild(printArea);
      document.body.appendChild(tempDiv);

      const images = tempDiv.getElementsByTagName("img");
      const promises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      Promise.all(promises).then(() => {
        window.print();
        setTimeout(() => {
          document.body.removeChild(tempDiv);
        }, 500);
      });
    }, 100);
  };

  const isCurrentView = selectedView === "current";
  const activeSnapshot = isCurrentView ? null : snapshotCache[selectedView];
  const displayRows = isCurrentView
    ? currentLedger
    : activeSnapshot?.ledgerData ?? [];
  const displayOpeningBalance = isCurrentView
    ? openingBalance
    : activeSnapshot?.openingBalance ?? 0;
  const currentInitialCharge = isCurrentView
    ? initialCharge
    : activeSnapshot?.initialCharge ?? 0;
  const currentInitialPayment = isCurrentView
    ? initialPayment
    : activeSnapshot?.initialPayment ?? 0;
  const totalCharge = useMemo(
    () =>
      currentInitialCharge +
      displayRows.reduce((s, r) => s + (r.charge || 0), 0),
    [displayRows, currentInitialCharge]
  );
  const totalPayment = useMemo(
    () =>
      currentInitialPayment +
      displayRows.reduce((s, r) => s + (r.payment || 0), 0),
    [displayRows, currentInitialPayment]
  );
  const finalBalance = useMemo(
    () => displayOpeningBalance + totalPayment - totalCharge,
    [displayOpeningBalance, totalPayment, totalCharge]
  );
  const selectedLabel = isCurrentView
    ? "Current Ledger"
    : snapshots.find((s) => s._id === selectedView)?.title ?? "Closed Ledger";

  // ── Helpers for customer info ──────────────────────────────────────────────
  const ownerDisplay = Array.isArray(customer?.owners) && customer.owners.length > 0
    ? customer.owners.map((o) => `${o?.name || ""}${o?.phone ? ` (${o.phone})` : ""}`).join(" • ")
    : typeof customer?.owners === "object" && customer?.owners !== null
    ? customer.owners.name || JSON.stringify(customer.owners)
    : customer?.ownerName || "—";

  const phoneDisplay = Array.isArray(customer?.phoneNumber)
    ? customer.phoneNumber.map((p) => p?.number || p).join(", ")
    : typeof customer?.phoneNumber === "object" && customer?.phoneNumber !== null
    ? customer.phoneNumber.number || JSON.stringify(customer.phoneNumber)
    : customer?.phoneNumber || "—";

  // ── Loading State ──────────────────────────────────────────────────────────
  if (pageLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050503]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-gray-200 dark:border-gray-800 rounded-full" />
            <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse">
            Generating Statement...
          </p>
        </div>
      </div>
    );

  return (
    <>
      {showCloseModal && (
        <CloseModal
          onClose={() => setShowCloseModal(false)}
          onConfirm={handleClose}
          loading={closeLoading}
        />
      )}
      {showInitialModal && (
        <InitialAmountModal
          initCharge={initialCharge}
          initPayment={initialPayment}
          initDate={initialDate}
          onClose={() => setShowInitialModal(false)}
          onConfirm={handleSetInitialAmount}
          loading={initialLoading}
        />
      )}
      {showSaveModal && (
        <SaveInvoiceModal
          onClose={() => setShowSaveModal(false)}
          onConfirm={handleSaveSelected}
          loading={isSavingSelected}
        />
      )}

      {/* ── Page Shell ──────────────────────────────────────────────────────── */}
      <div className="w-full min-h-screen bg-[#FAFAFA] dark:bg-[#050503] transition-colors px-4 sm:px-6 py-6">


        {/* ── Main Card ─────────────────────────────────────────────────────── */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] rounded-xl border border-[#E8E8EC] dark:border-gray-800 overflow-hidden print:border-none transition-colors">

          {/* ── Tab Bar ───────────────────────────────────────────────────── */}
          <div className="print:hidden flex border-b border-[#E8E8EC] dark:border-gray-800 bg-[#FAFAFA] dark:bg-[#0d0d0d] transition-colors">
            <button
              onClick={() => setActiveTab("ledger")}
              className={`cursor-pointer flex-1 py-3 text-[13px] font-medium tracking-wide flex items-center justify-center gap-2 transition-all ${
                activeTab === "ledger"
                  ? "text-[#6366F1] dark:text-indigo-400 border-b-2 border-[#6366F1] bg-[#FFFFFF] dark:bg-[#111111]"
                  : "text-[#6B6B6B] dark:text-gray-500 hover:text-[#0A0A0A] dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              }`}
            >
              <BookOpen size={16} />
              Ledger Statement
            </button>
            <button
              onClick={() => setActiveTab("saved-bills")}
              className={`flex-1 cursor-pointer py-3 text-[13px] font-medium tracking-wide flex items-center justify-center gap-2 transition-all ${
                activeTab === "saved-bills"
                  ? "text-[#6366F1] dark:text-indigo-400 border-b-2 border-[#6366F1] bg-[#FFFFFF] dark:bg-[#111111]"
                  : "text-[#6B6B6B] dark:text-gray-500 hover:text-[#0A0A0A] dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              }`}
            >
              <Receipt size={16} />
              Billing Invoices
            </button>
          </div>

          {/* ── Customer Info Header ──────────────────────────────────────── */}
          <div className="px-6 py-6 border-b border-[#E8E8EC] dark:border-gray-800/80 bg-[#FFFFFF] dark:bg-[#111111] transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">

              {/* Customer Details */}
              <div className="flex-1 min-w-0">
                {/* Name + Type Badge */}
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <h1 className="text-[32px] font-bold text-[#0A0A0A] dark:text-white tracking-tight leading-none">
                    {customer?.companyName || "Individual Customer"}
                  </h1>
                  {customer?.customerType === "Individual" && (
                    <span className="inline-flex items-center gap-1 text-[12px] bg-gray-100 dark:bg-blue-950/40 text-[#6B6B6B] dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                      <BadgeCheck size={14} />
                      Individual
                    </span>
                  )}
                </div>

                {/* Info rows */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Owner */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <User size={14} className="text-[#6B6B6B] dark:text-gray-500" />
                      </div>
                      <span className="text-[13px] font-medium text-[#6B6B6B] dark:text-gray-500 w-16">Owner</span>
                    </div>
                    <span className="text-[14px] font-medium text-[#0A0A0A] dark:text-gray-300 pt-0.5">
                      {ownerDisplay}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <Phone size={14} className="text-[#6B6B6B] dark:text-gray-500" />
                      </div>
                      <span className="text-[13px] font-medium text-[#6B6B6B] dark:text-gray-500 w-16">Phone</span>
                    </div>
                    <span className="text-[14px] font-medium text-[#0A0A0A] dark:text-gray-300 font-mono pt-0.5">
                      {phoneDisplay}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <MapPin size={14} className="text-[#6B6B6B] dark:text-gray-500" />
                      </div>
                      <span className="text-[13px] font-medium text-[#6B6B6B] dark:text-gray-500 w-16">Address</span>
                    </div>
                    <div className="text-[14px] font-medium text-[#0A0A0A] dark:text-gray-400 pt-0.5">
                      {Array.isArray(customer?.address) ? (
                        <div className="flex flex-col gap-1">
                          {customer.address.map((addr, idx) => (
                            <span key={idx}>
                              {typeof addr === "object" && addr !== null ? (
                                <>
                                  <span className="text-[#6B6B6B] dark:text-gray-400 font-medium text-[13px]">
                                    {addr.type || "Address"}:{" "}
                                  </span>
                                  {[addr.street, addr.union, addr.upazila, addr.district]
                                    .filter(Boolean)
                                    .join(", ")}
                                </>
                              ) : (
                                addr
                              )}
                            </span>
                          ))}
                        </div>
                      ) : typeof customer?.address === "object" && customer?.address !== null ? (
                        <span>
                          {[customer.address.street, customer.address.district]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      ) : (
                        <span>{customer?.address || "—"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ─────────────────────────────────────────── */}
              <div className="print:hidden flex flex-col gap-3 items-end shrink-0">
                {/* Save Selected */}
                {activeTab === "ledger" && isCurrentView && selectedRows.length > 0 && (
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={isSavingSelected}
                    className="flex cursor-pointer items-center gap-2 bg-[#6366F1] dark:bg-indigo-500 text-white rounded-md px-4 h-[38px] text-[14px] font-medium hover:bg-[#4F46E5] hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] -translate-y-px transition-all disabled:opacity-50"
                  >
                    {isSavingSelected ? "Saving..." : `Save Selected (${selectedRows.length})`}
                  </button>
                )}

                <div className="flex items-center gap-3">
                  {/* Ledger Selector Dropdown */}
                  {activeTab === "ledger" && (
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen((p) => !p)}
                        className="flex cursor-pointer items-center gap-2 border border-[#E8E8EC] dark:border-gray-700 bg-transparent dark:bg-[#1a1a1a] rounded-md px-4 h-[38px] text-[14px] font-medium text-[#0A0A0A] dark:text-gray-300 hover:bg-[#FAFAFA] dark:hover:bg-[#222] transition-colors"
                      >
                        <span className="text-sm leading-none">{isCurrentView ? "📂" : "🔒"}</span>
                        <span className="max-w-[120px] truncate">{selectedLabel}</span>
                        <ChevronDown
                          size={16}
                          className={`shrink-0 transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-40 py-1 overflow-hidden">
                          <button
                            onClick={() => {
                              setSelectedView("current");
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left cursor-pointer px-4 py-2.5 text-[11px] font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors ${
                              isCurrentView
                                ? "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/10"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <span>📂</span>
                            <span>Current Ledger</span>
                            {isCurrentView && (
                              <CheckCircle size={10} className="ml-auto text-blue-500 shrink-0" />
                            )}
                          </button>

                          {snapshots.length > 0 && (
                            <>
                              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                              <p className="px-4 py-1.5 text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                                Closed Ledgers
                              </p>
                              {snapshots.map((snap) => (
                                <button
                                  key={snap._id}
                                  onClick={() => {
                                    setSelectedView(snap._id);
                                    setDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors cursor-pointer flex items-start gap-2.5 ${
                                    selectedView === snap._id ? "bg-gray-50 dark:bg-[#222]" : ""
                                  }`}
                                >
                                  <Lock size={9} className="text-gray-400 mt-1 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                                      {snap.title}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                      {fmtDate(snap.closedAt)}
                                    </p>
                                  </div>
                                  {selectedView === snap._id && (
                                    <CheckCircle size={10} className="ml-auto text-blue-500 mt-1 shrink-0" />
                                  )}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Print Button */}
                  {activeTab === "ledger" && (
                    <button
                      onClick={handlePrint}
                      className="cursor-pointer bg-[#FFFFFF] border border-[#E8E8EC] hover:bg-[#FAFAFA] dark:bg-gray-800 dark:border-gray-700 text-[#0A0A0A] dark:text-white px-4 h-[38px] rounded-md text-[14px] font-medium transition-colors flex items-center gap-2"
                    >
                      <Printer size={16} className="text-[#6B6B6B]" />
                      Print
                    </button>
                  )}

                  {/* More Actions */}
                  {activeTab === "ledger" && isCurrentView && (
                    <div className="relative">
                      <button
                        onClick={() => setActionsMenuOpen((p) => !p)}
                        className="cursor-pointer border border-[#E8E8EC] dark:border-gray-700 bg-transparent hover:bg-[#FAFAFA] dark:bg-[#1a1a1a] dark:hover:bg-[#222] text-[#6B6B6B] dark:text-gray-400 rounded-md w-[38px] h-[38px] transition-colors flex items-center justify-center"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {actionsMenuOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 py-1 overflow-hidden">
                          <button
                            onClick={() => {
                              setShowInitialModal(true);
                              setActionsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors flex items-center gap-2.5"
                          >
                            <Pencil size={11} className="text-indigo-500" />
                            {initialCharge > 0 || initialPayment > 0
                              ? "Edit Initial Amount"
                              : "Set Initial Amount"}
                          </button>
                          {currentLedger.length > 0 && (
                            <button
                              onClick={() => {
                                setShowCloseModal(true);
                                setActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2.5"
                            >
                              <Lock size={11} />
                              Close Ledger
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Closed Ledger Warning Banner */}
            {!isCurrentView && activeSnapshot && (
              <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-4 py-2.5 rounded-xl transition-colors">
                <Lock size={11} />
                <span>
                  Closed Ledger — <strong>{activeSnapshot.title}</strong>
                  &nbsp;·&nbsp;Closed on {fmtDate(activeSnapshot.closedAt)}
                </span>
              </div>
            )}
          </div>

          {/* ── Content Area ──────────────────────────────────────────────── */}
          {activeTab === "ledger" ? (
            <>
              {!isCurrentView && !activeSnapshot ? (
                <div className="py-20 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse">
                      Loading snapshot...
                    </p>
                  </div>
                </div>
              ) : (
                <LedgerTable
                  rows={displayRows}
                  openingBalance={displayOpeningBalance}
                  initialCharge={
                    isCurrentView ? initialCharge : activeSnapshot?.initialCharge ?? 0
                  }
                  initialPayment={
                    isCurrentView ? initialPayment : activeSnapshot?.initialPayment ?? 0
                  }
                  initialDate={
                    isCurrentView ? initialDate : activeSnapshot?.initialDate ?? null
                  }
                  isCurrentView={isCurrentView}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                />
              )}

              <SummaryFooter
                totalCharge={totalCharge}
                totalPayment={totalPayment}
                finalBalance={finalBalance}
                openingBalance={displayOpeningBalance}
              />
            </>
          ) : (
            <div className="p-4 sm:p-6">
              <CustomerSavedBillsTab
                customerId={customerId}
                selectedView={selectedView}
                availableRows={
                  isCurrentView
                    ? currentLedger.filter((r) => !r.isSaved && r.recordId)
                    : []
                }
                onInvoiceUpdated={fetchCurrentLedger}
                companyAddress={customer?.address}
              />
            </div>
          )}

          {/* ── Document Footer ────────────────────────────────────────────── */}
          <div className="px-6 py-4 flex justify-between items-center bg-[#FAFAFA] dark:bg-[#0a0a0a] border-t border-[#E8E8EC] dark:border-gray-800 transition-colors">
            <div className="text-[13px] text-[#6B6B6B] dark:text-gray-500 font-medium">
              Statement generated at {new Date().toLocaleString()}
            </div>
          </div>

          {/* ── Hidden Print Area ─────────────────────────────────────────── */}
          <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
            <div ref={printRef}>
              <LedgerPrint
                customer={customer}
                rows={displayRows}
                openingBalance={displayOpeningBalance}
                initialCharge={currentInitialCharge}
                initialPayment={currentInitialPayment}
                initialDate={
                  currentInitialCharge > 0 || currentInitialPayment > 0
                    ? isCurrentView
                      ? initialDate
                      : activeSnapshot?.initialDate
                    : null
                }
                totalCharge={totalCharge}
                totalPayment={totalPayment}
                finalBalance={finalBalance}
                selectedLabel={selectedLabel}
                role="Customer"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
