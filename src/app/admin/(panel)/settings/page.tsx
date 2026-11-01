import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { TwoStep } from "./TwoStep";

export const metadata = { title: "Settings" };

const ACTION: Record<string, string> = {
  login: "Signed in", login_denied: "Sign-in refused", logout: "Signed out", create: "Created", update: "Edited",
  publish: "Published", unpublish: "Unpublished", schedule: "Scheduled", trash: "Moved to Trash", restore: "Restored",
  purge: "Deleted forever", revision_restore: "Restored older version", duplicate: "Duplicated",
  mfa_enrol: "2-step verification on", mfa_remove: "2-step verification off",
};

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const user = await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await createSessionClient();
  const [{ data: factors }, { data: log, count }] = await Promise.all([
    db!.auth.mfa.listFactors(),
    db!.from("admin_audit").select("id, at, actor, action, detail, post_id", { count: "exact" }).order("at", { ascending: false }).range((page - 1) * 50, page * 50 - 1),
  ]);
  const totp = factors?.totp?.find((f) => f.status === "verified") ?? null;
  const pages = Math.max(1, Math.ceil((count ?? 0) / 50));

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-[32px] font-bold text-primary">Settings</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="account-title" className="rounded-2xl border border-border bg-surface p-6">
          <h2 id="account-title" className="text-xl font-bold text-ink">Account</h2>
          <p className="mt-2 text-sm">Signed in as <strong>{user.email}</strong>.</p>
          <p className="mt-1 text-sm">Sessions end after 7 days, or after 12 hours without activity.</p>
          <p className="mt-3 text-sm">
            Need a password for email sign-in? Use <Link href="/admin/login" className="font-semibold text-primary hover:underline">Forgot password?</Link> on the sign-in page.
          </p>
        </section>
        <section aria-labelledby="mfa-title" className="rounded-2xl border border-border bg-surface p-6">
          <h2 id="mfa-title" className="text-xl font-bold text-ink">2-step verification</h2>
          <div className="mt-2">
            <TwoStep factorId={totp?.id ?? null} />
          </div>
        </section>
      </div>

      <section aria-labelledby="audit-title" className="mt-10">
        <h2 id="audit-title" className="text-xl font-bold text-ink">Audit log</h2>
        <p className="mt-1 text-sm">Every sign-in, publish, delete and restore. Entries can&apos;t be edited or removed.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-dark text-[11px] uppercase tracking-[0.16em] text-accent">
              <tr>{["When (IST)", "Who", "What", "Details"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(log ?? []).map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-4 py-2.5">{new Date(a.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-2.5">{a.actor}</td>
                  <td className="px-4 py-2.5 font-semibold text-ink">{ACTION[a.action] ?? a.action}</td>
                  <td className="px-4 py-2.5">
                    {a.post_id ? <Link href={`/admin/blogs/${a.post_id}/edit`} className="text-primary hover:underline">{a.detail}</Link> : a.detail}
                  </td>
                </tr>
              ))}
              {!log?.length && <tr><td colSpan={4} className="px-4 py-8 text-center">No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <nav aria-label="Audit log pages" className="mt-3 flex gap-2 text-sm">
            {page > 1 && <Link href={`/admin/settings?page=${page - 1}`} className="text-primary">← Newer</Link>}
            <span>Page {page} of {pages}</span>
            {page < pages && <Link href={`/admin/settings?page=${page + 1}`} className="text-primary">Older →</Link>}
          </nav>
        )}
      </section>
    </>
  );
}
