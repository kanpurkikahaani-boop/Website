import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function IconBadge({ icon: Icon, className, size = 36 }: { icon: LucideIcon; className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent", className)}
    >
      <Icon size={Math.round(size * 0.47)} strokeWidth={2} />
    </span>
  );
}
