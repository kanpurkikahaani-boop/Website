import type { Metadata } from "next";
import { LogoMark } from "@/components/layout/Logo";
import { requireAdminPage } from "@/lib/auth";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage() {
  await requireAdminPage();
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-bg-alt px-4 py-16">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-white p-8 text-center shadow-[0_20px_50px_-30px_rgba(60,30,20,0.35)]">
        <LogoMark size={64} decorative={false} className="mx-auto" />
        <p className="eyebrow mt-4">Team access</p>
        <h1 className="mt-1 text-2xl font-bold text-primary">Choose a new password</h1>
        <ResetForm />
      </div>
    </section>
  );
}
