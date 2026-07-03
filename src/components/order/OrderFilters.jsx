"use client";
import React from "react";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, BarChart3, Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "react-toastify";

const OrderFilters = ({
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
}) => {
  const [localStartDate, setLocalStartDate] = React.useState(customStartDate);
  const [localEndDate, setLocalEndDate] = React.useState(customEndDate);

  React.useEffect(() => {
    setLocalStartDate(customStartDate);
    setLocalEndDate(customEndDate);
  }, [customStartDate, customEndDate]);

  // Date range options representing Figma tabs
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
      {/* Figma Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-neutral-200/80 shadow-sm">
        {/* Left: Search box */}
        <div className="relative flex-1 min-w-[280px] lg:max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search order or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-16 py-2 bg-neutral-50/50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none gap-0.5">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-200 bg-white text-[10px] font-medium text-neutral-400 shadow-sm">
              Ctrl
            </kbd>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-200 bg-white text-[10px] font-medium text-neutral-400 shadow-sm">
              K
            </kbd>
          </div>
        </div>

        {/* Right: Date tabs + Graph toggle + Advanced Filters Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Date Range Tabs */}
          <div className="inline-flex p-1 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-medium">
            {dateTabs.map((tab) => {
              const isActive = dateRange === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleDateRangeChange(tab.value)}
                  className={`px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer capitalize ${
                    isActive
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Graph Toggle Switch */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 select-none">
            <BarChart3 size={14} className="text-neutral-500" />
            <span>Graph</span>
            <button
              type="button"
              onClick={() => setShowGraph(!showGraph)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showGraph ? "bg-neutral-900" : "bg-neutral-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showGraph ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Advanced Filters Toggle Button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium cursor-pointer transition-all ${
              showMoreFilters
                ? "bg-neutral-900 border-neutral-900 text-white"
                : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
            type="button"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {showMoreFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Custom Date Pickers Drawer (when 'custom' range is active) */}
      {dateRange === "custom" && (
        <div className="mt-3 flex flex-wrap items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Custom Range:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Start Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-start"
                    className="justify-start px-3 py-2 text-xs font-normal bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 min-w-[140px] shadow-sm rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-neutral-400" />
                    {localStartDate ? (
                      format(localStartDate, "LLL dd, y")
                    ) : (
                      <span>Start Date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-neutral-200 shadow-xl rounded-xl z-[100]" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    selected={localStartDate}
                    onSelect={(date) => {
                      setLocalStartDate(date);
                      if (date && localEndDate && date > localEndDate) {
                        setLocalEndDate(null);
                      }
                    }}
                    defaultMonth={localStartDate || new Date()}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-xs text-neutral-400 font-semibold">to</span>

              {/* End Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-end"
                    className="justify-start px-3 py-2 text-xs font-normal bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 min-w-[140px] shadow-sm rounded-lg"
                    disabled={!localStartDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-neutral-400" />
                    {localEndDate ? (
                      format(localEndDate, "LLL dd, y")
                    ) : (
                      <span>End Date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-neutral-200 shadow-xl rounded-xl z-[100]" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    selected={localEndDate}
                    onSelect={setLocalEndDate}
                    defaultMonth={localEndDate || localStartDate || new Date()}
                    disabled={(date) => (localStartDate ? date < localStartDate : false)}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              {/* Clear button if any date is selected */}
              {(localStartDate || localEndDate || customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalStartDate(null);
                    setLocalEndDate(null);
                    setCustomStartDate(null);
                    setCustomEndDate(null);
                  }}
                  className="p-1.5 hover:bg-neutral-200 rounded-full transition-colors text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  title="Clear selection"
                >
                  <X size={14} />
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
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-md text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Collapsible Advanced Filters Drawer */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showMoreFilters ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            {/* Status Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="batch">Batch</option>
                <option value="inprocess">In Process</option>
                <option value="completedprocess">Completed Process</option>
                <option value="delivered">Delivered</option>
                <option value="billing">Billing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Cloth Type Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Cloth Type</label>
              <select
                value={clotheType}
                onChange={(e) => setClotheType(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              >
                <option value="">All Cloth Types</option>
                {data?.clotheTypes?.map((item) => (
                  <option key={item?._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Finishing Type Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Finishing Type</label>
              <select
                value={finishingType}
                onChange={(e) => setFinishingType(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              >
                <option value="">All Finishings</option>
                {data?.finishingTypes?.map((item) => (
                  <option key={item?._id || item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Colour Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Colour</label>
              <select
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              >
                <option value="">All Colours</option>
                {data?.colours?.map((item) => (
                  <option key={item?._id || item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sill Name Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Sill Name</label>
              <select
                value={sillName}
                onChange={(e) => setSillName(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              >
                <option value="">All Sills</option>
                {data?.sillNames?.map((item) => (
                  <option key={item?._id || item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              >
                <option value="">All Qualities</option>
                {data?.qualities?.map((item) => (
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
