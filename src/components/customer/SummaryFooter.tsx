// @ts-nocheck
"use client";
import React from "react";

function SummaryFooter({
  totalCharge,
  totalPayment,
  finalBalance,
  openingBalance,
}) {
  const isDue = finalBalance < 0;
  const isAdvance = finalBalance > 0;

  return (
    <div className="border-t border-[#E8E8EC] dark:border-gray-800 bg-[#FAFAFA] dark:bg-[#0a0a0a] transition-colors rounded-b-xl">
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#E8E8EC] dark:divide-gray-800">
          
          {/* Total Billings */}
          <div className="flex flex-col gap-2 py-4 md:py-0 md:pr-8">
            <p className="text-[13px] font-medium text-[#6B6B6B] dark:text-gray-400">
              Total Billings
            </p>
            <p className="text-[20px] lg:text-[24px] font-bold text-[#0A0A0A] dark:text-gray-100 tabular-nums tracking-tight truncate">
              ৳{totalCharge.toLocaleString()}
            </p>
          </div>

          {/* Total Received */}
          <div className="flex flex-col gap-2 py-4 md:py-0 md:px-8">
            <p className="text-[13px] font-medium text-[#6B6B6B] dark:text-gray-400">
              Total Received
            </p>
            <p className="text-[20px] lg:text-[24px] font-bold text-[#10B981] dark:text-emerald-400 tabular-nums tracking-tight truncate">
              ৳{totalPayment.toLocaleString()}
            </p>
          </div>

          {/* Final Balance */}
          <div className="flex flex-col gap-2 py-4 md:py-0 md:pl-8 md:items-end">
            <p className="text-[13px] font-medium text-[#6366F1] dark:text-indigo-400">
              Final Balance
            </p>
            <div className="flex items-center gap-3">
              <p
                className={`text-[24px] lg:text-[32px] font-bold tracking-tight tabular-nums leading-none truncate ${
                  isDue
                    ? "text-[#EF4444] dark:text-red-400"
                    : isAdvance
                    ? "text-[#10B981] dark:text-teal-400"
                    : "text-[#0A0A0A] dark:text-gray-300"
                }`}
              >
                {isDue
                  ? `− ৳${Math.abs(finalBalance).toLocaleString()}`
                  : isAdvance
                  ? `+ ৳${finalBalance.toLocaleString()}`
                  : `৳0`}
              </p>
              <span
                className={`text-[12px] font-medium uppercase tracking-wider px-3 py-1 rounded-full ${
                  isDue
                    ? "bg-[#EF4444]/10 text-[#EF4444] dark:bg-red-950/30 dark:text-red-400"
                    : isAdvance
                    ? "bg-[#10B981]/10 text-[#10B981] dark:bg-teal-950/30 dark:text-teal-400"
                    : "bg-gray-100 text-[#6B6B6B] dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {isDue ? "DUE" : isAdvance ? "ADVANCE" : "CLEAR"}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default React.memo(SummaryFooter);
