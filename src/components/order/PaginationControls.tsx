// @ts-nocheck
"use client";
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  totalItems?: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
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
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          Rows per page
        </span>
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="appearance-none bg-background border border-border rounded-[4px] px-3 py-2 pr-8 text-sm font-normal text-foreground cursor-pointer shadow-sm hover:border-border/80 focus:outline-none focus:border-foreground transition-all min-w-[72px]"
          >
            <option value={10}>10</option>
            <option value={12}>12</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
          />
        </div>
      </div>

      {/* Center: spacer */}
      <div className="flex-1" />

      {/* Right: Page info + navigation buttons */}
      <div className="flex items-center gap-8">
        {/* Page indicator */}
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          Page {currentPage} of {effectiveTotalPages}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {/* First page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-[4px] border transition-all cursor-pointer
              ${
                currentPage <= 1
                  ? "border-border bg-card opacity-50 cursor-not-allowed"
                  : "border-border bg-background hover:border-border/80 hover:bg-accent shadow-sm active:scale-95"
              }`}
            title="First page"
          >
            <ChevronsLeft size={16} className="text-muted-foreground" />
          </button>

          {/* Previous page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-[4px] border transition-all cursor-pointer
              ${
                currentPage <= 1
                  ? "border-border bg-card opacity-50 cursor-not-allowed"
                  : "border-border bg-background hover:border-border/80 hover:bg-accent shadow-sm active:scale-95"
              }`}
            title="Previous page"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>

          {/* Next page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= effectiveTotalPages}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-[4px] border transition-all cursor-pointer
              ${
                currentPage >= effectiveTotalPages
                  ? "border-border bg-card opacity-50 cursor-not-allowed"
                  : "border-border bg-background hover:border-border/80 hover:bg-accent shadow-sm active:scale-95"
              }`}
            title="Next page"
          >
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => onPageChange(effectiveTotalPages)}
            disabled={currentPage >= effectiveTotalPages}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-[4px] border transition-all cursor-pointer
              ${
                currentPage >= effectiveTotalPages
                  ? "border-border bg-card opacity-50 cursor-not-allowed"
                  : "border-border bg-background hover:border-border/80 hover:bg-accent shadow-sm active:scale-95"
              }`}
            title="Last page"
          >
            <ChevronsRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
