"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { navGroups, groupFor, type NavGroup } from "@/data/nav";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./MobileMenu";

export function Navbar({ logo }: { logo: React.ReactNode }) {
  const pathname = usePathname();
  const current = groupFor(pathname);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close menus on route change
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(null);
    setMobileOpen(false);
  }

  // Outside click + Escape
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border/80 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="container-site flex h-[72px] items-center justify-between gap-4">
        {logo}
        <nav ref={navRef} aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-[14.5px] font-medium transition-colors",
                  pathname === "/" ? "bg-primary-soft text-primary" : "text-ink hover:text-primary",
                )}
              >
                Home
              </Link>
            </li>
            {navGroups.map((g) => (
              <NavDropdown
                key={g.label}
                group={g}
                pathname={pathname}
                isCurrent={current?.label === g.label}
                isOpen={open === g.label}
                setOpen={(v) => setOpen((o) => (v ? g.label : o === g.label ? null : o))}
              />
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-primary-soft lg:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={24} aria-hidden />
        </button>
      </div>
    </header>
    {/* Rendered outside <header>: backdrop-filter would otherwise trap position:fixed */}
    <MobileMenu open={mobileOpen} onClose={closeMobile} pathname={pathname} />
    </>
  );
}

function NavDropdown({
  group,
  pathname,
  isCurrent,
  isOpen,
  setOpen,
}: {
  group: NavGroup;
  pathname: string;
  isCurrent: boolean;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = `nav-${group.label.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }, [setOpen]);
  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, [setOpen]);

  function focusItem(i: number) {
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("a");
    if (!links?.length) return;
    links[(i + links.length) % links.length].focus();
  }

  function onButtonKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    const links = Array.from(listRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    const idx = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(idx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(idx - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  }

  return (
    <li
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={onButtonKey}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-4 py-2 text-[14.5px] font-medium transition-colors",
          isCurrent ? "bg-primary-soft text-primary" : isOpen ? "text-primary" : "text-ink hover:text-primary",
        )}
      >
        {group.label}
        <ChevronDown
          size={15}
          aria-hidden
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition duration-150",
          isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
        )}
      >
        <ul
          ref={listRef}
          id={id}
          onKeyDown={onListKey}
          className="min-w-[240px] rounded-xl border border-border bg-surface p-2 shadow-[0_18px_40px_-16px_rgba(40,20,10,0.25)]"
        >
          {group.items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  tabIndex={isOpen ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3.5 py-2.5 text-[14px] transition-colors",
                    active ? "bg-primary-soft font-semibold text-primary" : "text-ink hover:bg-bg-alt hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}
