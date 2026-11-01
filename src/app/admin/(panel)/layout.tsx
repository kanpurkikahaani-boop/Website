import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/auth";

/** Layer 2: every admin page re-verifies the session on the server, even after the proxy. */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-[70vh] bg-bg-alt">
      <header className="bg-dark text-cream">
        <div className="container-site flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/admin" className="flex items-center gap-2 font-display text-[15px] font-semibold text-cream">
              <LogoMark size={28} /> Admin
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-cream/80 hover:text-accent">
              View site ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
            <span className="hidden text-cream/60 md:inline">{user.email}</span>
            <form action="/admin/auth/signout" method="post">
              <button type="submit" className="rounded-full border border-cream/30 px-3.5 py-1 text-[13px] font-semibold text-cream hover:border-accent hover:text-accent">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-site py-10">{children}</div>
    </div>
  );
}
