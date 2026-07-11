"use client";
import React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, BarChart3, Calendar as CalendarIcon, X, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

interface OrderFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  dateRange: string;
  handleDateRangeChange: (val: string) => void;
  customStartDate: Date | null;
  setCustomStartDate: (date: Date | null) => void;
  customEndDate: Date | null;
  setCustomEndDate: (date: Date | null) => void;
  handleCustomApply: (start: Date | null, end: Date | null) => void;
  status: string;
  setStatus: (val: string) => void;
  clotheType: string;
  setClotheType: (val: string) => void;
  finishingType: string;
  setFinishingType: (val: string) => void;
  colour: string;
  setColour: (val: string) => void;
  sillName: string;
  setSillName: (val: string) => void;
  quality: string;
  setQuality: (val: string) => void;
  showMoreFilters: boolean;
  setShowMoreFilters: (val: boolean) => void;
  data: any;
  showGraph: boolean;
  setShowGraph: (val: boolean) => void;
  isTrashMode?: boolean;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  dateRange,
  handleDateRangeChange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  handleCustomApply,
  status,
  setStatus,
  clotheType,
  setClotheType,
  finishingType,
  setFinishingType,
  colour,
  setColour,
  sillName,
  setSillName,
  quality,
  setQuality,
  showMoreFilters,
  setShowMoreFilters,
  data,
  showGraph,
  setShowGraph,
  isTrashMode = false,
}) => {
  const [localStartDate, setLocalStartDate] = React.useState<Date | null>(customStartDate);
  const [localEndDate, setLocalEndDate] = React.useState<Date | null>(customEndDate);

  React.useEffect(() => {
    setLocalStartDate(customStartDate);
    setLocalEndDate(customEndDate);
  }, [customStartDate, customEndDate]);

  const dateTabs = [
    { label: "Custom", value: "custom" },
    { label: "current year", value: "current_year" },
    { label: "3 months", value: "3_months" },
    { label: "30 days", value: "30_days" },
    { label: "7 days", value: "7_days" },
    { label: "3 days", value: "3_days" },
  ];

  return (
    <div className="w-full mb-1">
      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-background p-2 rounded-[8px] border border-border shadow-sm">
        {/* Left: Search box */}
        <div className="relative flex-1 min-w-[280px] lg:max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search order or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-16 py-2 rounded-[4px] text-[13px] transition-all focus:outline-none bg-card text-foreground border border-border focus:border-[#f54e00]"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none gap-0.5">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-background text-[10px] font-medium shadow-sm border border-border text-muted-foreground">
              Ctrl
            </kbd>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-background text-[10px] font-medium shadow-sm border border-border text-muted-foreground">
              K
            </kbd>
          </div>
        </div>

        {/* Right: Date tabs + Graph toggle + Advanced Filters Button + New Order */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Date Range Tabs */}
          <div className="flex max-w-full overflow-x-auto hide-scrollbar p-1 rounded-[4px] text-[11px] font-medium bg-card border border-border">
            {dateTabs.map((tab) => {
              const isActive = dateRange === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleDateRangeChange(tab.value)}
                  className={`px-2.5 py-1.5 rounded-[2px] transition-all duration-200 cursor-pointer capitalize ${
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Graph Toggle Switch */}
          {!isTrashMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-[11px] font-medium select-none bg-card border border-border text-muted-foreground">
              <BarChart3 size={13} className="text-muted-foreground/70" />
              <span>Graph</span>
                <button
                  type="button"
                  onClick={() => setShowGraph(!showGraph)}
                  className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showGraph ? "bg-foreground" : "bg-foreground/20"
                  }`}
                >
                <span
                  className="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out"
                  style={{ transform: showGraph ? "translateX(14px)" : "translateX(0px)", marginTop: "1px" }}
                />
              </button>
            </div>
          )}

          {/* Advanced Filters Toggle Button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-[11px] font-medium cursor-pointer transition-all border ${
              showMoreFilters
                ? "bg-foreground border-foreground text-background"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            {showMoreFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Trash Button */}
          {!isTrashMode && (
            <Link
              href="/dashboard/order/trash"
              className="inline-flex items-center justify-center gap-1.5 bg-background border border-border text-muted-foreground hover:text-foreground text-[11px] font-medium px-3 py-2 rounded-[4px] transition-colors shadow-sm cursor-pointer"
            >
              <Trash2 size={13} /> Trash
            </Link>
          )}

          {/* New Order Button */}
          {!isTrashMode && (
            <Link
              href="/dashboard/createOrder"
              className="inline-flex items-center justify-center gap-1.5 bg-[#f54e00] hover:bg-[#c43e00] text-primary-foreground text-[11px] font-medium px-3 py-2 rounded-[4px] transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={13} /> New Order
            </Link>
          )}
        </div>
      </div>

      {/* Custom Date Pickers Drawer */}
      {dateRange === "custom" && (
        <div className="mt-2 flex flex-wrap items-center gap-3 p-3 rounded-[8px] animate-in fade-in slide-in-from-top-1 duration-200 bg-card border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Custom Range:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-start"
                    className="justify-start px-3 py-2 text-[11px] font-normal bg-background border-border text-foreground hover:bg-accent min-w-[140px] shadow-sm rounded-[4px]"
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {localStartDate ? format(localStartDate, "LLL dd, y") : <span>Start Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border shadow-xl rounded-[8px] z-[100]" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    selected={localStartDate || undefined}
                    onSelect={(date) => {
                      setLocalStartDate(date ?? null);
                      if (date && localEndDate && date > localEndDate) {
                        setLocalEndDate(null);
                      }
                    }}
                    defaultMonth={localStartDate || new Date()}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-[11px] text-muted-foreground/70 font-semibold">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-end"
                    className="justify-start px-3 py-2 text-[11px] font-normal bg-background border-border text-foreground hover:bg-accent min-w-[140px] shadow-sm rounded-[4px]"
                    disabled={!localStartDate}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {localEndDate ? format(localEndDate, "LLL dd, y") : <span>End Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border shadow-xl rounded-[8px] z-[100]" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    selected={localEndDate || undefined}
                    onSelect={(date) => setLocalEndDate(date ?? null)}
                    defaultMonth={localEndDate || localStartDate || new Date()}
                    disabled={(date) => (localStartDate ? date < localStartDate : false)}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              {(localStartDate || localEndDate || customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalStartDate(null);
                    setLocalEndDate(null);
                    setCustomStartDate(null);
                    setCustomEndDate(null);
                  }}
                  className="p-1.5 hover:bg-accent rounded-full transition-colors text-muted-foreground/70 hover:text-muted-foreground cursor-pointer"
                  title="Clear selection"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (!localStartDate || !localEndDate) {
                toast.error("Please select both start and end date");
                return;
              }
              handleCustomApply(localStartDate, localEndDate);
            }}
            className="px-4 py-1.5 text-primary-foreground rounded-[4px] text-[11px] font-medium transition cursor-pointer bg-primary hover:bg-primary/90"
          >
            Apply
          </button>
        </div>
      )}

      {/* Collapsible Advanced Filters Drawer */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showMoreFilters ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-3 rounded-[8px] bg-card border border-border">
            {/* Status Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-2 bg-background rounded-[4px] text-[12px] font-medium focus:outline-none border border-border text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="batch">Batch</option>
                <option value="inprocess">In Process</option>
                <option value="completedprocess">Completed Process</option>
                <option value="delivered">Dispatch</option>
                <option value="billing">Billing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Cloth Type Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Cloth Type</label>
              <select
                value={clotheType}
                onChange={(e) => setClotheType(e.target.value)}
                className="w-full px-2.5 py-2 bg-background rounded-[4px] text-[12px] font-medium focus:outline-none border border-border text-foreground"
              >
                <option value="">All Cloth Types</option>
                {data?.clotheTypes?.map((item: any) => (
                  <option key={item?._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Finishing Type Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Finishing Type</label>
              <select
                value={finishingType}
                onChange={(e) => setFinishingType(e.target.value)}
                className="w-full px-2.5 py-2 bg-background rounded-[4px] text-[12px] font-medium focus:outline-none border border-border text-foreground"
              >
                <option value="">All Finishings</option>
                {data?.finishingTypes?.map((item: any) => (
                  <option key={item?._id || item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Colour Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Colour</label>
              <select
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="w-full px-2.5 py-2 bg-background rounded-[4px] text-[12px] font-medium focus:outline-none border border-border text-foreground"
              >
                <option value="">All Colours</option>
                {data?.colours?.map((item: any) => (
                  <option key={item?._id || item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sill Name Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Sill Name</label>
              <select
                value={sillName}
                onChange={(e) => setSillName(e.target.value)}
                className="w-full px-2.5 py-2 bg-background rounded-[4px] text-[12px] font-medium focus:outline-none border border-border text-foreground"
              >
                <option value="">All Sills</option>
                {data?.sillNames?.map((item: any) => (
                  <option key={item?._id || item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-2.5 py-2 bg-background rounded-[4px] text-[12px] font-medium focus:outline-none border border-border text-foreground"
              >
                <option value="">All Qualities</option>
                {data?.qualities?.map((item: any) => (
                  <option key={item?._id || item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;
