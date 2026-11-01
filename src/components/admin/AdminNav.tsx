"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/authors", label: "Authors" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-0.5">
      {links.map((l) => {
        const active = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("rounded-full px-3 py-1 text-[13px] font-medium transition", active ? "bg-cream/15 text-accent" : "text-cream/85 hover:text-accent")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
