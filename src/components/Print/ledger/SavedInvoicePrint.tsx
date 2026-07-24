// @ts-nocheck
"use client";

import Image from "next/image";
import React from "react";
import QRCode from "react-qr-code";
import { fmtDate } from "@/components/customer/ledgerUtils";
import { Phone, MapPin } from "lucide-react";

export default function SavedInvoicePrint({ invoice, companyAddress }) {
  if (!invoice) return null;

  const records = invoice.records || [];
  const isPrevDueRow = (r) =>
    r.displayOrderId === "Previous Due" ||
    r.clothType === "Previous Due" ||
    r.quality === "Previous Due" ||
    (r.description &&
      /(previous\s+(due|ledger|balance|bill))|(পূর্বের|আগের)\s*(বকেয়া|জের|বিল|ব্যালেন্স)/i.test(
        r.description
      )) ||
    (r.clothType &&
      /(previous\s+(due|ledger|balance|bill))|(পূর্বের|আগের)\s*(বকেয়া|জের|বিল|ব্যালেন্স)/i.test(
        r.clothType
      ));

  const previousDue = records
    .filter(isPrevDueRow)
    .reduce((sum, r) => sum + (Number(r.charge) || 0), 0);

  const totalCharge = invoice.totalCharge || 0;
  const totalRecentBill = totalCharge - previousDue;
  const totalPayment = invoice.totalPayment || 0;
  const netDue = totalCharge - totalPayment;

  const formattedAddress =
    typeof companyAddress === "object"
      ? [
        companyAddress.street,
        companyAddress.union,
        companyAddress.upazila,
        companyAddress.thana,
        companyAddress.paurashava,
        companyAddress.district,
        companyAddress.division,
      ]
        .filter(Boolean)
        .join(", ")
      : companyAddress;

  const bkashQrUrl = "https://qr.bka.sh/281014021SxzK2lsIy16BCA341";

  const renderCopy = (copyType) => (
    <div
      className="print-page relative text-slate-800 font-sans bg-white flex flex-col mx-auto shadow-xl rounded-sm"
      style={{
        width: "148mm",
        minHeight: "210mm",
        padding: "0",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        border: "1px solid #cbd5e1",
      }}
    >
      {/* Top Header Accent */}
      <div className="h-[2px] w-full bg-[#003B5C] shrink-0"></div>

      <div className="px-[6mm] pt-[5mm] pb-[5mm] flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-2.5 border-b border-slate-200 pb-2.5">
            <div className="flex gap-2.5 items-center">
              <div className="w-12 h-12 relative shrink-0">
                <img
                  src="/Image/logo.png"
                  alt="Company Logo"
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[15px] font-extrabold text-[#003B5C] leading-tight">
                  মেসার্স এম.এন ডাইং এন্ড ফিনিশিং এজেন্ট
                </h1>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#003B5C] inline shrink-0" />
                  ঠিকানা: মাধবদী, নরসিংদী
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold mt-0.5">
                  <Phone className="w-3 h-3 text-[#003B5C] shrink-0" />
                  <span>01711-201870, 01782-155151</span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end shrink-0">
              <h2 className="text-xl font-black text-[#003B5C] tracking-wider uppercase mb-1">
                INVOICE
              </h2>
              <div
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white ${copyType === "Client Copy"
                  ? "text-[#003B5C] border border-[#003B5C]"
                  : "text-amber-700 border border-amber-600"
                  }`}
              >
                {copyType}
              </div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 bg-white rounded-lg px-3 py-2 mb-2.5 border border-[#CBD5E1]">
            <div className="space-y-0.5">
              <p className="font-bold text-[#003B5C] uppercase tracking-wider text-[8.5px]">
                BILLED TO / প্রাপক:
              </p>
              <p className="text-[12px] font-extrabold text-slate-900 leading-snug">
                {invoice.companyName || "—"}
              </p>
              {formattedAddress && (
                <p className="text-[9px] text-slate-600 max-w-[190px] leading-tight mt-0.5">
                  {formattedAddress}
                </p>
              )}
            </div>

            <div className="flex flex-col justify-center items-end space-y-1 text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold uppercase text-[8.5px]">
                  INVOICE NO:
                </span>
                <span className="font-bold font-mono text-[#003B5C] bg-white border border-[#003B5C]/30 px-1.5 py-0.5 rounded text-[10px]">
                  {invoice.invoiceNumber || "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold uppercase text-[8.5px]">
                  DATE:
                </span>
                <span className="font-semibold text-slate-900 text-[10px]">
                  {invoice.createdAt ? fmtDate(invoice.createdAt) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Bill Table */}
          <div className="mb-2.5">
            <table
              className="w-full border-collapse"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: "11%" }} />
                <col style={{ width: "19.5%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "2%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "2%" }} />
                <col style={{ width: "14.5%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr className="bg-white text-[#003B5C] border-b-[1.5px] border-[#003B5C]">
                  <th className="py-1.5 px-1 text-center font-extrabold text-[9.5px] uppercase tracking-tight">
                    তারিখ
                  </th>
                  <th className="py-1.5 px-1 text-center font-extrabold text-[9.5px] uppercase tracking-tight">
                    ID / Ref
                  </th>
                  <th className="py-1.5 px-1 text-left font-extrabold text-[9.5px] uppercase tracking-tight">
                    বিবরণ
                  </th>
                  <th className="py-1.5 px-1 text-right font-extrabold text-[11px] uppercase tracking-tight">
                    QTY
                  </th>
                  <th className="py-1.5 px-0 text-center font-extrabold text-[12px] text-[#003B5C]">
                    ×
                  </th>
                  <th className="py-1.5 px-1 text-right font-extrabold text-[11px] uppercase tracking-tight">
                    RATE
                  </th>
                  <th className="py-1.5 px-0 text-center font-extrabold text-[12px] text-[#003B5C]">
                    =
                  </th>
                  <th className="py-1.5 px-1 text-right font-extrabold text-[11px] uppercase tracking-tight">
                    CHARGE (+)
                  </th>
                  <th className="py-1.5 px-1 text-right font-extrabold text-[11px] uppercase tracking-tight">
                    PAYMENT (-)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-x border-b border-[#CBD5E1] text-[9px] bg-white">
                {records.map((row, idx) => {
                  const isDueRow = isPrevDueRow(row);

                  // Clean extraction of Invoice / Ref ID for Previous Due rows
                  let dueInvId = null;
                  if (isDueRow) {
                    if (row.invoiceNumber && row.invoiceNumber !== "Previous Due") {
                      dueInvId = row.invoiceNumber;
                    } else if (row.itemInvoiceNumber && row.itemInvoiceNumber !== "Previous Due") {
                      dueInvId = row.itemInvoiceNumber;
                    } else if (row.displayOrderId && row.displayOrderId !== "Previous Due") {
                      dueInvId = row.displayOrderId;
                    } else if (row.description) {
                      const match = row.description.match(/(?:INV|ord|#ord)-[A-Z0-9-]+/i);
                      if (match) {
                        dueInvId = match[0];
                      }
                    }
                  }

                  const isPaymentRow =
                    row.payment > 0 ||
                    (row.provider && row.provider !== "BILLING");

                  const hasQtyRate = row.qty && row.price && !isDueRow && !isPaymentRow;
                  const rawInvoiceStr =
                    row.description && row.description.startsWith("Invoice:")
                      ? row.description
                      : row.invoiceNumber
                        ? `Invoice: ${row.invoiceNumber}`
                        : row.itemInvoiceNumber
                          ? `Invoice: ${row.itemInvoiceNumber}`
                          : null;

                  const deliverySlipInvoice = rawInvoiceStr
                    ? rawInvoiceStr.replace(/^Invoice:\s*/i, "")
                    : null;

                  return (
                    <tr
                      key={idx}
                      className={
                        isDueRow
                          ? "bg-amber-50/40 font-medium text-amber-900"
                          : "bg-white"
                      }
                    >
                      {/* Date */}
                      <td className="py-1.5 px-1 text-center text-slate-700 font-medium whitespace-nowrap align-middle text-[8.5px]">
                        {fmtDate(row.date)}
                      </td>

                      {/* ID / Ref */}
                      <td className="py-1.5 px-1 text-center text-slate-800 font-medium align-middle overflow-hidden">
                        {isDueRow ? (
                          dueInvId ? (
                            <div className="text-[8px] font-mono font-bold text-amber-950 truncate max-w-full" title={dueInvId}>
                              {dueInvId}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[8.5px]">—</span>
                          )
                        ) : row.displayOrderId ? (
                          <div className="flex flex-col items-center">
                            <div className="text-[8.5px] font-mono font-bold text-slate-900 whitespace-nowrap">
                              {row.displayOrderId}
                            </div>
                            {deliverySlipInvoice && (
                              <div className="text-[7.5px] font-mono text-slate-600 whitespace-nowrap mt-0.5">
                                {deliverySlipInvoice}
                              </div>
                            )}
                          </div>
                        ) : row.provider && row.provider !== "BILLING" ? (
                          <span className="inline-block text-[7.5px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded uppercase">
                            {row.provider}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[8.5px]">—</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-1.5 px-1 text-left leading-snug text-slate-800 align-middle">
                        {isDueRow ? (
                          <div className="font-bold text-amber-900 text-[9.5px]">পূর্বের বকেয়া বিল</div>
                        ) : isPaymentRow ? (
                          <div className="text-slate-400 text-[9.5px]">
                            {row.description &&
                              !row.description.startsWith("Invoice:") &&
                              !row.description.includes("—")
                              ? row.description
                              : "—"}
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-900 text-[9.5px]">
                              {[row.clothType, row.quality]
                                .filter((v) => v && v !== "—" && v !== "undefined")
                                .join(" / ") || "—"}
                            </div>
                            {[row.finishingType, row.sillName, row.colour].filter(
                              (v) => v && v !== "—" && v !== "undefined"
                            ).length > 0 && (
                                <div className="text-[8px] text-slate-500 mt-0.5 font-normal">
                                  {[row.finishingType, row.sillName, row.colour]
                                    .filter((v) => v && v !== "—" && v !== "undefined")
                                    .join(" / ")}
                                </div>
                              )}
                          </>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-900 align-middle whitespace-nowrap text-[11px]">
                        {row.qty && !isDueRow && !isPaymentRow ? row.qty.toLocaleString() : "—"}
                      </td>

                      {/* × */}
                      <td className="py-1.5 px-0 text-center align-middle text-slate-600 font-extrabold text-[12px] leading-none">
                        {hasQtyRate ? "×" : ""}
                      </td>

                      {/* Rate */}
                      <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-800 align-middle whitespace-nowrap text-[11px]">
                        {row.price && !isDueRow && !isPaymentRow ? `৳${row.price}` : "—"}
                      </td>

                      {/* = */}
                      <td className="py-1.5 px-0 text-center align-middle text-slate-600 font-extrabold text-[12px] leading-none">
                        {hasQtyRate ? "=" : ""}
                      </td>

                      {/* Charge */}
                      <td className="py-1.5 px-1 text-right font-mono font-extrabold text-slate-950 align-middle whitespace-nowrap text-[11px]">
                        {row.charge > 0 ? `৳${row.charge.toLocaleString()}` : "—"}
                      </td>

                      {/* Payment */}
                      <td className="py-1.5 px-1 text-right font-mono font-extrabold text-[#059669] align-middle whitespace-nowrap text-[11px]">
                        {row.payment > 0 ? `৳${row.payment.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom / Calculations */}
        <div className="shrink-0 pt-1" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
          <div className="border-t-2 border-dashed border-slate-300 mb-2.5"></div>

          <div className="flex justify-between items-start gap-2.5 mb-3">
            {/* bKash QR — Client Copy only */}
            {copyType === "Client Copy" ? (
              <div
                className="flex items-stretch rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shrink-0"
                style={{
                  width: "205px",
                }}
              >
                {/* Content */}
                <div className="flex items-center gap-2 px-2.5 py-2 w-full">
                  {/* QR Code Frame */}
                  <div className="bg-white p-1 rounded-lg border border-[#E2E8F0] shrink-0 flex items-center justify-center">
                    <QRCode
                      value={bkashQrUrl}
                      size={50}
                      style={{ height: "50px", maxWidth: "100%", width: "50px" }}
                      viewBox="0 0 256 256"
                    />
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[7.5px] font-black text-[#D81B60] uppercase tracking-widest leading-none">
                        PAY With
                      </span>
                      <img
                        src="/Image/bkash.png"
                        alt="bKash"
                        className="object-contain"
                        style={{ height: "12px", width: "auto" }}
                      />
                    </div>
                    <p className="text-[12.5px] font-black text-[#D81B60] tracking-wider font-mono leading-tight">
                      01782-155151
                    </p>
                    <div className="mt-0.5">
                      <span
                        className="inline-block text-[7px] font-extrabold uppercase tracking-wider text-[#D81B60] bg-white border border-[#D81B60] px-1.5 py-0.5 rounded-md"
                      >
                        PERSONAL ACCOUNT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ width: "205px" }} />
            )}

            {/* Totals box */}
            <div className="w-[200px] border border-[#003B5C] rounded-lg overflow-hidden bg-white shrink-0">
              <div className="p-2 space-y-0.5 text-slate-800 font-semibold text-[10px] bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Sub Total:</span>
                  <span className="font-bold font-mono text-[11px] text-slate-900">
                    ৳{totalRecentBill.toLocaleString()}
                  </span>
                </div>
                {previousDue > 0 && (
                  <div className="flex justify-between items-center text-amber-900">
                    <span className="text-amber-800">Previous Due:</span>
                    <span className="font-bold font-mono text-[11px]">
                      ৳{previousDue.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-0.5 text-slate-900">
                  <span className="font-bold">Total Bill:</span>
                  <span className="font-extrabold font-mono text-[11.5px]">
                    ৳{totalCharge.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#059669]">
                  <span>Total Received:</span>
                  <span className="font-bold font-mono text-[11px]">
                    ৳{totalPayment.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="bg-white text-[#003B5C] border-t border-[#003B5C] px-2.5 py-1.5 flex justify-between items-center font-extrabold text-[11px]">
                <span>Balance:</span>
                <span className="font-mono text-[11.5px] tracking-wide">
                  {netDue > 0
                    ? `৳${netDue.toLocaleString()} (Due)`
                    : netDue < 0
                    ? `৳${Math.abs(netDue).toLocaleString()} (Advance)`
                    : `৳0`}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-start items-center px-3 pt-2 pb-0.5">
            {copyType === "Client Copy" ? (
              <div className="text-center" style={{ width: "130px" }}>
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-[9.5px] font-bold text-slate-800">
                    কর্তৃপক্ষের স্বাক্ষর
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center" style={{ width: "110px" }}>
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-[9.5px] font-bold text-slate-800">
                    গ্রাহকের স্বাক্ষর
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="print-only min-h-screen bg-slate-200/90 py-8 flex flex-col items-center justify-center gap-8 print:bg-transparent print:py-0 print:gap-0 print:block">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A5 portrait;
            margin: 0mm !important;
          }
          html, body {
            width: 148mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          .print-only {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 148mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }
          .print-page {
            width: 148mm !important;
            min-height: 210mm !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: visible !important;
          }
        }
      `,
        }}
      />
      {renderCopy("Client Copy")}
      {renderCopy("Office Copy")}
    </div>
  );
}


