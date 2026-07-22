import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CursorComboboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options: { label: string; value: string }[];
  onValueChange?: (value: string) => void;
}

export const CursorCombobox = React.forwardRef<HTMLInputElement, CursorComboboxProps>(
  ({ options, className, onValueChange, value, onChange, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Also support getting value from props if controlled by RHF
    const inputValue = value !== undefined ? String(value) : "";

    const filteredOptions = options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        opt.value.toLowerCase().includes(inputValue.toLowerCase())
    );

    useEffect(() => {
      setActiveIndex(-1);
    }, [inputValue, open]);

    useEffect(() => {
      if (open && activeIndex >= 0 && listboxRef.current) {
        const activeElement = listboxRef.current.children[activeIndex] as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({ block: "nearest" });
        }
      }
    }, [activeIndex, open]);

    const handleSelect = (opt: { label: string; value: string }) => {
      onValueChange?.(opt.value);
      if (onChange) {
        const event = {
          target: { value: opt.value, name: props.name },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
      setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <input
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground shadow-sm",
            className
          )}
          {...props}
        />
        {open && filteredOptions.length > 0 && (
          <div ref={listboxRef} className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-popover text-popover-foreground border border-border z-50 rounded-md shadow-md">
            {filteredOptions.map((opt, idx) => (
              <div
                key={`${opt.value}-${idx}`}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer transition-colors",
                  idx === activeIndex 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

CursorCombobox.displayName = "CursorCombobox";
