"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Me {
  admin: boolean;
  email?: string;
  postId?: string | null;
}

/**
 * Admin-only shortcuts on the public site. Nothing is in the HTML visitors receive: the browser
 * asks /api/admin/me (which checks the real session) and only then draws the bar, the
 * "Edit this post" pill and the "+ New post" button. Visitors without the hint cookie never ask.
 */
export function AdminIsland() {
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const slug = path.startsWith("/blogs/") && !path.startsWith("/blogs/author/") ? path.slice(7).split("/")[0] : null;
  const skip = path.startsWith("/admin") || path.startsWith("/preview");

  useEffect(() => {
    if (skip || !document.cookie.split("; ").includes("kkk_admin_hint=1")) return;
    let live = true;
    fetch(`/api/admin/me${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`, { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json() as Promise<Me>)
      .then((m) => {
        if (!live) return;
        setMe(m.admin ? m : null);
        setSlot(document.getElementById("admin-slot-blogs"));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [slug, skip]);

  if (!me || skip) return null;
  return (
    <>
      <div role="region" aria-label="Admin" className="fixed inset-x-0 top-0 z-[100] flex h-8 items-center justify-center gap-3 bg-dark text-[12.5px] text-cream shadow">
        <span className="text-accent">Signed in as team</span>
        <span aria-hidden>·</span>
        <Link href="/admin" className="font-semibold hover:text-accent">Admin dashboard</Link>
        <span aria-hidden>·</span>
        <form action="/admin/auth/signout" method="post">
          <button type="submit" className="font-semibold hover:text-accent">Sign out</button>
        </form>
      </div>
      {slug && me.postId && (
        <Link
          href={`/admin/blogs/${me.postId}/edit`}
          className="fixed bottom-5 right-5 z-[100] rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-hover"
        >
          ✎ Edit this post
        </Link>
      )}
      {path === "/blogs" &&
        slot &&
        createPortal(
          <div className="flex justify-end pt-6">
            <Link href="/admin/blogs/new" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">+ New post</Link>
          </div>,
          slot,
        )}
    </>
  );
}
