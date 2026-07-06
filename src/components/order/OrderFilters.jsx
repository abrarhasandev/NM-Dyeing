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
    <div className="w-full mb-1" style={{ fontFamily: "var(--mn-font-primary)" }}>
      {/* Figma Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-2 rounded-xl border shadow-sm" style={{ borderColor: "var(--mn-surface)" }}>
        {/* Left: Search box */}
        <div className="relative flex-1 min-w-[280px] lg:max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: "var(--mn-text-tertiary)" }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search order or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-16 py-2 rounded-lg text-[13px] transition-all focus:outline-none"
            style={{
              backgroundColor: "var(--mn-background-3)",
              border: "1px solid var(--mn-surface)",
              color: "var(--mn-text-primary)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--mn-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--mn-surface)")}
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none gap-0.5">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[10px] font-medium shadow-sm" style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-tertiary)" }}>
              Ctrl
            </kbd>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[10px] font-medium shadow-sm" style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-tertiary)" }}>
              K
            </kbd>
          </div>
        </div>

        {/* Right: Date tabs + Graph toggle + Advanced Filters Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Date Range Tabs */}
          <div
            className="inline-flex p-1 rounded-lg text-[11px] font-medium"
            style={{ backgroundColor: "var(--mn-surface)", border: "1px solid var(--mn-surface-alt)" }}
          >
            {dateTabs.map((tab) => {
              const isActive = dateRange === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleDateRangeChange(tab.value)}
                  className="px-2.5 py-1.5 rounded-md transition-all duration-200 cursor-pointer capitalize"
                  style={{
                    backgroundColor: isActive ? "var(--mn-accent)" : "transparent",
                    color: isActive ? "#ffffff" : "var(--mn-text-secondary)",
                    boxShadow: isActive ? "var(--mn-elevation-1)" : "none",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(28,39,76,0.08)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Graph Toggle Switch */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium select-none"
            style={{ backgroundColor: "var(--mn-background-3)", border: "1px solid var(--mn-surface)", color: "var(--mn-text-secondary)" }}
          >
            <BarChart3 size={13} style={{ color: "var(--mn-text-tertiary)" }} />
            <span>Graph</span>
            <button
              type="button"
              onClick={() => setShowGraph && setShowGraph(!showGraph)}
              className="relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              style={{ backgroundColor: showGraph ? "var(--mn-accent)" : "var(--mn-surface-alt)" }}
            >
              <span
                className="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{ transform: showGraph ? "translateX(14px)" : "translateX(0px)", marginTop: "1px" }}
              />
            </button>
          </div>

          {/* Advanced Filters Toggle Button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
            style={{
              backgroundColor: showMoreFilters ? "var(--mn-accent)" : "white",
              border: showMoreFilters ? "1px solid var(--mn-accent)" : "1px solid var(--mn-surface)",
              color: showMoreFilters ? "#ffffff" : "var(--mn-text-secondary)",
            }}
            type="button"
            onMouseEnter={(e) => { if (!showMoreFilters) e.currentTarget.style.backgroundColor = "var(--mn-background-alt)"; }}
            onMouseLeave={(e) => { if (!showMoreFilters) e.currentTarget.style.backgroundColor = "white"; }}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            {showMoreFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Custom Date Pickers Drawer (when 'custom' range is active) */}
      {dateRange === "custom" && (
        <div className="mt-2 flex flex-wrap items-center gap-3 p-3 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200" style={{ backgroundColor: "var(--mn-background-3)", border: "1px solid var(--mn-surface)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: "var(--mn-text-secondary)" }}>Custom Range:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Start Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-start"
                    className="justify-start px-3 py-2 text-[11px] font-normal bg-white border-[#E4E4E7] text-[#71717A] hover:bg-[#FAFAFA] min-w-[140px] shadow-sm rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#A1A1AA]" />
                    {localStartDate ? (
                      format(localStartDate, "LLL dd, y")
                    ) : (
                      <span>Start Date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-[#E4E4E7] shadow-xl rounded-xl z-[100]" align="start">
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

              <span className="text-[11px] text-[#A1A1AA] font-semibold">to</span>

              {/* End Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-end"
                    className="justify-start px-3 py-2 text-[11px] font-normal bg-white border-[#E4E4E7] text-[#71717A] hover:bg-[#FAFAFA] min-w-[140px] shadow-sm rounded-lg"
                    disabled={!localStartDate}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#A1A1AA]" />
                    {localEndDate ? (
                      format(localEndDate, "LLL dd, y")
                    ) : (
                      <span>End Date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-[#E4E4E7] shadow-xl rounded-xl z-[100]" align="start">
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
                  className="p-1.5 hover:bg-[#F4F4F5] rounded-full transition-colors text-[#A1A1AA] hover:text-[#71717A] cursor-pointer"
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
            className="px-4 py-1.5 text-white rounded-md text-[11px] font-medium transition cursor-pointer"
            style={{ backgroundColor: "var(--mn-accent)", borderRadius: "var(--mn-radius-sm-3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-accent-4)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-accent)")}
            suppressHydrationWarning
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--mn-background-3)", border: "1px solid var(--mn-surface)" }}>
            {/* Status Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--mn-text-tertiary)" }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-2 bg-white rounded-lg text-[12px] font-medium focus:outline-none"
                style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-primary)" }}
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
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--mn-text-tertiary)" }}>Cloth Type</label>
              <select
                value={clotheType}
                onChange={(e) => setClotheType(e.target.value)}
                className="w-full px-2.5 py-2 bg-white rounded-lg text-[12px] font-medium focus:outline-none"
                style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-primary)" }}
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
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--mn-text-tertiary)" }}>Finishing Type</label>
              <select
                value={finishingType}
                onChange={(e) => setFinishingType(e.target.value)}
                className="w-full px-2.5 py-2 bg-white rounded-lg text-[12px] font-medium focus:outline-none"
                style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-primary)" }}
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
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--mn-text-tertiary)" }}>Colour</label>
              <select
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="w-full px-2.5 py-2 bg-white rounded-lg text-[12px] font-medium focus:outline-none"
                style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-primary)" }}
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
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--mn-text-tertiary)" }}>Sill Name</label>
              <select
                value={sillName}
                onChange={(e) => setSillName(e.target.value)}
                className="w-full px-2.5 py-2 bg-white rounded-lg text-[12px] font-medium focus:outline-none"
                style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-primary)" }}
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
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--mn-text-tertiary)" }}>Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-2.5 py-2 bg-white rounded-lg text-[12px] font-medium focus:outline-none"
                style={{ border: "1px solid var(--mn-surface)", color: "var(--mn-text-primary)" }}
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
