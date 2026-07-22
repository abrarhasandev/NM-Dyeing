// @ts-nocheck
"use client";
import React from "react";
import { fmtDate } from "./ledgerUtils";

function LedgerTable({
  rows,
  openingBalance,
  initialCharge,
  initialPayment,
  initialDate,
  isCurrentView,
  selectedRows,
  setSelectedRows,
}) {
  const hasInitial = initialCharge > 0 || initialPayment > 0;
  const initialBalance = (initialPayment || 0) - (initialCharge || 0);
  const effectiveOpening = openingBalance + initialBalance;

  if (!rows.length && !hasInitial && openingBalance === 0) {
    return (
      <div className="py-20 text-center">
        <div className="inline-flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[12px] bg-[#FAFAFA] dark:bg-gray-800/50 flex items-center justify-center border border-[#E8E8EC] dark:border-gray-700">
            <svg className="w-7 h-7 text-[#6B6B6B] dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-gray-200 tracking-tight">
              কোনো লেনদেন নেই
            </p>
            <p className="text-[13px] text-[#6B6B6B] dark:text-gray-500 font-medium">
              নতুন bill যোগ হলে এখানে দেখাবে
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-[1000px]">
        {/* ── Table Head ──────────────────────────────────────────────────── */}
        <thead>
          <tr className="bg-[#FAFAFA] dark:bg-[#0a0a0a] border-b border-[#E8E8EC] dark:border-gray-800">
            {isCurrentView && (
              <th className="px-4 py-3 w-[56px] text-center">
                <input
                  type="checkbox"
                  className="rounded w-5 h-5 border-[#E8E8EC] dark:border-gray-600 bg-white dark:bg-[#1a1a1a] text-[#6366F1] dark:text-indigo-500 focus:ring-2 focus:ring-[#6366F1]/12 dark:focus:ring-indigo-600/30 cursor-pointer"
                  checked={
                    rows.length > 0 &&
                    selectedRows.length === rows.filter((r) => !r.isSaved).length &&
                    rows.filter((r) => !r.isSaved).length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) setSelectedRows(rows.filter((r) => !r.isSaved));
                    else setSelectedRows([]);
                  }}
                />
              </th>
            )}
            {[
              { label: "Date", align: "left" },
              { label: "Order ID", align: "left" },
              { label: "Method", align: "left" },
              { label: "Description", align: "left" },
              { label: "Charge (+)", align: "right" },
              { label: "Payment (−)", align: "right" },
              { label: "Balance", align: "right", extraCls: "pr-4" },
            ].map((col) => (
              <th
                key={col.label}
                className={`px-4 py-3 text-[13px] font-medium text-[#6B6B6B] dark:text-gray-500 tracking-wide whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"} ${col.extraCls || ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Table Body ──────────────────────────────────────────────────── */}
        <tbody className="divide-y divide-[#E8E8EC] dark:divide-gray-800/50 bg-[#FFFFFF] dark:bg-[#111]">

          {/* Opening Balance Row */}
          {openingBalance !== 0 && (
            <tr className="hover:bg-[#FAFAFA] dark:hover:bg-[#161616] transition-colors">
              {isCurrentView && <td className="px-4 py-4" />}
              <td className="px-4 py-4 whitespace-nowrap text-[13px] text-[#6B6B6B] dark:text-gray-400">—</td>
              <td className="px-4 py-4 whitespace-nowrap text-[13px] text-[#6B6B6B] dark:text-gray-400">—</td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-gray-100 dark:bg-gray-800 text-[#6B6B6B] dark:text-gray-300">
                  CARRY FWD
                </span>
              </td>
              <td className="px-4 py-4 text-[14px] font-medium text-[#0A0A0A] dark:text-gray-200">
                Opening Balance (Previous Period)
              </td>
              <td className="px-4 py-4 text-right text-[13px] text-[#6B6B6B] dark:text-gray-400">—</td>
              <td className="px-4 py-4 text-right text-[13px] text-[#6B6B6B] dark:text-gray-400">—</td>
              <td className="px-4 py-4 text-right pr-4">
                <span
                  className={`inline-flex items-center justify-end text-[13px] font-bold px-3 py-1 rounded-full tabular-nums ${
                    openingBalance < 0
                      ? "text-[#EF4444] bg-[#EF4444]/10 dark:bg-red-950/30 dark:text-red-400"
                      : "text-[#10B981] bg-[#10B981]/10 dark:bg-teal-950/30 dark:text-teal-400"
                  }`}
                >
                  {openingBalance < 0
                    ? `− ৳${Math.abs(openingBalance).toLocaleString()}`
                    : `+ ৳${openingBalance.toLocaleString()}`}
                </span>
              </td>
            </tr>
          )}

          {/* Initial Amount Row */}
          {hasInitial && (
            <tr className="hover:bg-[#FAFAFA] dark:hover:bg-[#161616] transition-colors">
              {isCurrentView && <td className="px-4 py-4" />}
              <td className="px-4 py-4 whitespace-nowrap text-[13px] font-medium text-[#6B6B6B] dark:text-gray-400">
                {initialDate ? fmtDate(initialDate) : "—"}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-[13px] text-[#6B6B6B] dark:text-gray-600">—</td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium ${
                    initialPayment > 0 && initialCharge === 0
                      ? "bg-[#10B981]/10 text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-300"
                      : initialCharge > 0 && initialPayment === 0
                      ? "bg-[#EF4444]/10 text-[#EF4444] dark:bg-red-950/40 dark:text-red-300"
                      : "bg-[#6366F1]/10 text-[#6366F1] dark:bg-indigo-950/40 dark:text-indigo-300"
                  }`}
                >
                  INITIAL
                </span>
              </td>
              <td className="px-4 py-4 text-[14px] font-medium text-[#0A0A0A] dark:text-gray-200">
                Opening Balance (শুরুর পুরনো হিসাব)
              </td>
              <td className="px-4 py-4 text-right text-[14px] font-bold text-[#0A0A0A] dark:text-gray-200 tabular-nums">
                {initialCharge > 0 ? `৳${initialCharge.toLocaleString()}` : "—"}
              </td>
              <td className="px-4 py-4 text-right text-[14px] font-bold text-[#10B981] dark:text-emerald-400 tabular-nums">
                {initialPayment > 0 ? `৳${initialPayment.toLocaleString()}` : "—"}
              </td>
              <td className="px-4 py-4 text-right pr-4">
                <span
                  className={`inline-flex items-center justify-end text-[13px] font-bold px-3 py-1 rounded-full tabular-nums ${
                    effectiveOpening < 0
                      ? "text-[#EF4444] bg-[#EF4444]/10 dark:bg-red-950/30 dark:text-red-400"
                      : "text-[#10B981] bg-[#10B981]/10 dark:bg-teal-950/30 dark:text-teal-400"
                  }`}
                >
                  {effectiveOpening < 0
                    ? `− ৳${Math.abs(effectiveOpening).toLocaleString()}`
                    : `+ ৳${effectiveOpening.toLocaleString()}`}
                </span>
              </td>
            </tr>
          )}

          {/* Data Rows */}
          {rows.map((row, idx) => {
            const isSelected = selectedRows.some(
              (r) => r.recordId === row.recordId && r.modelType === row.modelType
            );
            const isCredit = row.type === "credit";
            const isEven = idx % 2 === 0;

            return (
              <tr
                key={idx}
                className={`transition-colors duration-200 group ${
                  isSelected
                    ? "bg-[#6366F1]/5 dark:bg-indigo-950/25"
                    : "hover:bg-[#FAFAFA] dark:hover:bg-[#161616]"
                } ${row.isSaved ? "opacity-60" : ""}`}
              >
                {/* Checkbox */}
                {isCurrentView && (
                  <td className="px-4 py-4 whitespace-nowrap align-top text-center">
                    <div className="flex items-start justify-center gap-1.5 pt-0.5">
                      <input
                        type="checkbox"
                        disabled={row.isSaved}
                        checked={row.isSaved || isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRows([...selectedRows, row]);
                          else
                            setSelectedRows(
                              selectedRows.filter(
                                (r) => !(r.recordId === row.recordId && r.modelType === row.modelType)
                              )
                            );
                        }}
                        className={`rounded w-5 h-5 border-[#E8E8EC] dark:border-gray-600 bg-white dark:bg-[#1a1a1a] text-[#6366F1] dark:text-indigo-500 focus:ring-2 focus:ring-[#6366F1]/12 dark:focus:ring-indigo-600/30 ${
                          row.isSaved ? "cursor-not-allowed grayscale opacity-50" : "cursor-pointer"
                        }`}
                      />
                      {row.isSaved && (
                        <span className="hidden">Saved</span>
                      )}
                    </div>
                  </td>
                )}

                {/* Date */}
                <td className="px-4 py-4 whitespace-nowrap align-top">
                  <span className="text-[13px] font-medium text-[#6B6B6B] dark:text-gray-400 tabular-nums">
                    {fmtDate(row.date)}
                  </span>
                </td>

                {/* Order ID */}
                <td className="px-4 py-4 whitespace-nowrap align-top">
                  {row.displayOrderId ? (
                    <span className="text-[13px] font-mono font-medium text-[#6366F1] dark:text-indigo-400">
                      {row.displayOrderId}
                    </span>
                  ) : (
                    <span className="text-[#6B6B6B] dark:text-gray-500 text-[13px]">—</span>
                  )}
                </td>

                {/* Method Badge */}
                <td className="px-4 py-4 whitespace-nowrap align-top">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium ${
                      isCredit
                        ? "bg-[#10B981]/10 text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-300"
                        : row.provider === "BILLING"
                        ? "bg-gray-100 text-[#6B6B6B] dark:bg-gray-800 dark:text-gray-300"
                        : "bg-gray-100 text-[#6B6B6B] dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {row.provider}
                  </span>
                </td>

                {/* Description + Attribute Tags */}
                <td className="px-4 py-4 align-top">
                  <div className="font-medium text-[#0A0A0A] dark:text-gray-200 text-[14px]">
                    {row.description}
                  </div>
                  {(row.clothType || row.quality || row.sillName || row.colour || row.finishingType) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {row.clothType && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[#6B6B6B] dark:text-gray-400 text-[12px] px-3 py-1 rounded-full font-medium">
                          <span className="opacity-60">Type</span>
                          <span className="opacity-40">·</span>
                          {row.clothType}
                        </span>
                      )}
                      {row.quality && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[#6B6B6B] dark:text-gray-400 text-[12px] px-3 py-1 rounded-full font-medium">
                          <span className="opacity-60">Qty</span>
                          <span className="opacity-40">·</span>
                          {row.quality}
                        </span>
                      )}
                      {row.sillName && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[#6B6B6B] dark:text-gray-400 text-[12px] px-3 py-1 rounded-full font-medium">
                          <span className="opacity-60">Sill</span>
                          <span className="opacity-40">·</span>
                          {row.sillName}
                        </span>
                      )}
                      {row.colour && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[#6B6B6B] dark:text-gray-400 text-[12px] px-3 py-1 rounded-full font-medium">
                          <span className="opacity-60">Color</span>
                          <span className="opacity-40">·</span>
                          {row.colour}
                        </span>
                      )}
                      {row.finishingType && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[#6B6B6B] dark:text-gray-400 text-[12px] px-3 py-1 rounded-full font-medium">
                          <span className="opacity-60">Finish</span>
                          <span className="opacity-40">·</span>
                          {row.finishingType}
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* Charge */}
                <td className="px-4 py-4 text-right whitespace-nowrap align-top">
                  {row.charge > 0 ? (
                    <div>
                      <div className="text-[#0A0A0A] dark:text-gray-200 font-bold text-[14px] tabular-nums">
                        ৳{row.charge.toLocaleString()}
                      </div>
                      <div className="text-[#6B6B6B] dark:text-gray-500 text-[13px] mt-1 font-medium tabular-nums">
                        {row.qty} × {row.price}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#E8E8EC] dark:text-gray-700 text-[14px]">—</span>
                  )}
                </td>

                {/* Payment */}
                <td className="px-4 py-4 text-right align-top">
                  {row.payment > 0 ? (
                    <span className="text-[#10B981] dark:text-emerald-400 font-bold text-[14px] whitespace-nowrap tabular-nums">
                      ৳{row.payment.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[#E8E8EC] dark:text-gray-700 text-[14px]">—</span>
                  )}
                </td>

                {/* Balance */}
                <td className="px-4 py-4 text-right whitespace-nowrap align-top pr-4">
                  <span
                    className={`inline-flex items-center justify-end text-[13px] font-bold px-3 py-1 rounded-full tabular-nums ${
                      row.balance < 0
                        ? "text-[#EF4444] bg-[#EF4444]/10 dark:bg-red-950/30 dark:text-red-400"
                        : row.balance === 0
                        ? "text-[#6B6B6B] bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                        : "text-[#10B981] bg-[#10B981]/10 dark:bg-teal-950/30 dark:text-teal-400"
                    }`}
                  >
                    {row.balance < 0
                      ? `− ৳${Math.abs(row.balance).toLocaleString()}`
                      : row.balance === 0
                      ? "৳0"
                      : `+ ৳${row.balance.toLocaleString()}`}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(LedgerTable);