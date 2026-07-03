"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center gap-1 h-9",
        caption_label: "text-sm font-semibold text-neutral-900 dark:text-neutral-50",
        caption_dropdowns: "flex justify-center gap-1.5 z-10",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 border-neutral-200 dark:border-neutral-800"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-neutral-500 rounded-md w-9 font-medium text-[0.8rem] dark:text-neutral-400 text-center",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-neutral-100 dark:[&:has([aria-selected])]:bg-neutral-800",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-neutral-100 hover:text-neutral-900 rounded-md transition-all"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: "day-selected",
        day_today: "bg-neutral-100 text-neutral-950 font-bold dark:bg-neutral-800 dark:text-neutral-50",
        day_outside:
          "day-outside text-neutral-400 opacity-40 aria-selected:bg-neutral-100/50 aria-selected:text-neutral-400 aria-selected:opacity-30 dark:text-neutral-600",
        day_disabled: "text-neutral-400 opacity-30 dark:text-neutral-600",
        day_range_middle: "day-range-middle",
        day_hidden: "invisible",
        dropdown: "px-2 py-1 border border-neutral-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white font-medium cursor-pointer select-none",
        vhidden: "sr-only",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />,
        Dropdown: ({ value, onChange, children, ...props }) => {
          const options = React.Children.toArray(children);
          const selected = options.find((child) => child.props.value === value);
          const selectedLabel = selected ? selected.props.children : "";

          return (
            <Select
              value={value?.toString()}
              onValueChange={(val) => {
                if (onChange) {
                  const event = {
                    target: { value: val },
                  };
                  onChange(event);
                }
              }}
            >
              <SelectTrigger className="h-8 w-[100px] gap-1 border-neutral-200 bg-white px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white [&>span]:line-clamp-1">
                <SelectValue placeholder={selectedLabel}>
                  {selectedLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-white dark:bg-neutral-950 z-[100] border border-neutral-200 dark:border-neutral-800">
                {options.map((option) => (
                  <SelectItem
                    key={option.props.value}
                    value={option.props.value.toString()}
                    className="text-xs"
                  >
                    {option.props.children}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
      }}
      fromYear={2015}
      toYear={new Date().getFullYear() + 5}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
