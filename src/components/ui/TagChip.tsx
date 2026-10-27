import { cn } from "@/lib/utils";

export function TagChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-bg-alt px-2.5 py-0.5 text-[11px] font-medium leading-5 text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
