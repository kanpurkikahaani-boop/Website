"use client";

import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navGroups, groupFor } from "@/data/nav";
import { cn } from "@/lib/utils";

export function MobileMenu({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const [expanded, setExpanded] = useState<string | null>(() => groupFor(pathname)?.label ?? null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        // simple focus trap
        const f = panelRef.current.querySelectorAll<HTMLElement>("a, button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-[70] lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open} inert={!open}>
      <div
        className={cn("absolute inset-0 bg-dark/50 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          "absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-bg shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-border px-5">
          <span className="font-display text-lg font-bold text-ink">
            Kanpur <span className="text-primary">Ki</span> Kahaani
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary-soft"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <nav aria-label="Mobile" className="flex-1 px-3 py-4">
          <Link
            href="/"
            className={cn(
              "block rounded-xl px-4 py-3 text-base font-semibold",
              pathname === "/" ? "bg-primary-soft text-primary" : "text-ink",
            )}
          >
            Home
          </Link>
          {navGroups.map((g) => {
            const isExp = expanded === g.label;
            const pid = `m-${g.label.replace(/\W+/g, "-")}`;
            return (
              <div key={g.label} className="border-b border-border/70 last:border-0">
                <button
                  type="button"
                  aria-expanded={isExp}
                  aria-controls={pid}
                  onClick={() => setExpanded(isExp ? null : g.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-semibold",
                    groupFor(pathname)?.label === g.label ? "text-primary" : "text-ink",
                  )}
                >
                  {g.label}
                  <ChevronDown size={18} aria-hidden className={cn("transition-transform", isExp && "rotate-180")} />
                </button>
                <ul id={pid} hidden={!isExp} className="pb-2 pl-3">
                  {g.items.map((i) => (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        aria-current={pathname === i.href ? "page" : undefined}
                        className={cn(
                          "block rounded-lg px-4 py-2.5 text-[15px]",
                          pathname === i.href ? "bg-primary-soft font-semibold text-primary" : "text-muted hover:text-primary",
                        )}
                      >
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-border p-5">
          <Link href="/tourism#planner" className="block rounded-full bg-primary py-3 text-center text-sm font-semibold text-white">
            Plan your trip
          </Link>
        </div>
      </div>
    </div>
  );
}
