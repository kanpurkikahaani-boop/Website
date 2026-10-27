import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small muted note flagging sample / indicative data. */
export function SampleNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-xs text-muted", className)}>
      <Info size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
