"use client";
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) {
    return null;
  }

  const effectiveTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex items-center justify-between py-2 px-1 select-none">
      {/* Left: Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-900 whitespace-nowrap">
          Rows per page
        </span>
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 pr-8 text-sm font-normal text-neutral-900 cursor-pointer shadow-[0_1px_2px_0_rgba(0,0,0,0.1)] hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-300 transition-all min-w-[72px]"
          >
            <option value={10}>10</option>
            <option value={12}>12</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
          />
        </div>
      </div>

      {/* Center: spacer */}
      <div className="flex-1" />

      {/* Right: Page info + navigation buttons */}
      <div className="flex items-center gap-8">
        {/* Page indicator */}
        <span className="text-sm font-medium text-neutral-900 whitespace-nowrap">
          Page {currentPage} of {effectiveTotalPages}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {/* First page (chevrons-left) */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border bg-white transition-all cursor-pointer
              ${
                currentPage <= 1
                  ? "border-neutral-200 opacity-50 cursor-not-allowed"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] active:scale-95"
              }`}
            title="First page"
          >
            <ChevronsLeft size={16} className="text-neutral-700" />
          </button>

          {/* Previous page (chevron-left) */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border bg-white transition-all cursor-pointer
              ${
                currentPage <= 1
                  ? "border-neutral-200 opacity-50 cursor-not-allowed"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] active:scale-95"
              }`}
            title="Previous page"
          >
            <ChevronLeft size={16} className="text-neutral-700" />
          </button>

          {/* Next page (chevron-right) */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= effectiveTotalPages}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border bg-white transition-all cursor-pointer
              ${
                currentPage >= effectiveTotalPages
                  ? "border-neutral-200 opacity-50 cursor-not-allowed"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] active:scale-95"
              }`}
            title="Next page"
          >
            <ChevronRight size={16} className="text-neutral-700" />
          </button>

          {/* Last page (chevrons-right) */}
          <button
            type="button"
            onClick={() => onPageChange(effectiveTotalPages)}
            disabled={currentPage >= effectiveTotalPages}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border bg-white transition-all cursor-pointer
              ${
                currentPage >= effectiveTotalPages
                  ? "border-neutral-200 opacity-50 cursor-not-allowed"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] active:scale-95"
              }`}
            title="Last page"
          >
            <ChevronsRight size={16} className="text-neutral-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
