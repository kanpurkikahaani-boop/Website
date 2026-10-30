import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/news", label: "News sources" },
];

/** Layer 2: every admin page re-verifies the session on the server, even after the proxy. */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-[70vh]">
      <div className="border-b border-border bg-surface">
        <div className="container-site flex flex-wrap items-center justify-between gap-3 py-3">
          <nav aria-label="Admin" className="flex flex-wrap gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-primary-soft hover:text-primary">
                {l.label}
              </Link>
            ))}
          </nav>
          <form action="/admin/auth/signout" method="post" className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{user.email}</span>
            <button type="submit" className="rounded-full border border-border px-4 py-1.5 font-semibold text-ink hover:border-primary hover:text-primary">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="container-site py-10">{children}</div>
    </div>
  );
}
