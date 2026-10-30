import Link from "next/link";
import { FileText, Newspaper, Users } from "lucide-react";
import { IconBadge } from "@/components/ui/IconBadge";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const db = await createSessionClient();
  const [posts, drafts, subs, run] = await Promise.all([
    db?.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    db?.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    db?.from("subscribers").select("id", { count: "exact", head: true }).is("unsubscribed_at", null),
    db?.from("news_runs").select("finished_at, items_upserted, ok").order("finished_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const cards = [
    { href: "/admin/blogs", icon: FileText, title: "Blogs", stat: `${posts?.count ?? 0} published · ${drafts?.count ?? 0} drafts` },
    { href: "/admin/subscribers", icon: Users, title: "Subscribers", stat: `${subs?.count ?? 0} active` },
    {
      href: "/admin/news",
      icon: Newspaper,
      title: "News sources",
      stat: run?.data?.finished_at
        ? `Last run ${new Date(run.data.finished_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · ${run.data.items_upserted} items`
        : "No refresh has run yet",
    },
  ];
  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-[32px] font-bold text-primary">Dashboard</h1>
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="block rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <IconBadge icon={c.icon} size={44} />
              <h2 className="mt-4 text-xl font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm">{c.stat}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
