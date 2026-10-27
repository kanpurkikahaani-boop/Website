"use client";

import { cn } from "@/lib/utils";

export interface PillOption<T extends string = string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}

/** Single-select outline pills; active = maroon fill. Rendered as a toolbar of toggle buttons. */
export function FilterPills<T extends string>({ options, value, onChange, label, className, size = "md" }: Props<T>) {
  return (
    <div role="toolbar" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border font-medium transition-colors duration-200",
              size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-[13px]",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-ink hover:border-primary/50 hover:text-primary",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
