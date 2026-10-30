import type { Metadata } from "next";
import { LogoMark } from "@/components/layout/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Team login" };

const errors: Record<string, string> = {
  forbidden: "This area is for the Kanpur Ki Kahaani team only.",
  unconfigured: "Sign-in isn't set up yet. Add the Supabase keys and ADMIN_EMAIL (see SETUP.md).",
  callback: "That sign-in link has expired or was already used. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? errors[error] : undefined;
  return (
    <section className="container-site flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-[0_20px_50px_-30px_rgba(60,30,20,0.35)]">
        <LogoMark size={64} decorative={false} className="mx-auto" />
        <p className="eyebrow mt-4">Team only</p>
        <h1 className="mt-1 text-2xl font-bold text-primary">Sign in to Kanpur Ki Kahaani</h1>
        {message && (
          <p role="alert" className="mt-4 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
            {message}
          </p>
        )}
        <LoginForm configured={isSupabaseConfigured()} />
      </div>
    </section>
  );
}
