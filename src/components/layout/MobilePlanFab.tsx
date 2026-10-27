"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { track } from "@/lib/analytics";

/** Floating "Plan your trip" button on small screens. */
export function MobilePlanFab() {
  const pathname = usePathname();
  return (
    <Link
      href="/tourism#planner"
      onClick={() => track("hero_cta_click", { cta: "mobile_fab", from: pathname })}
      className="no-print fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(142,43,30,0.6)] transition hover:bg-primary-hover lg:hidden"
    >
      <CalendarRange size={18} aria-hidden />
      Plan your trip
    </Link>
  );
}
