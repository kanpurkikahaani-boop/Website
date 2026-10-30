import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { verifyUnsubscribe } from "@/lib/newsletter/unsubscribe";
import { createServiceClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

async function unsubscribe(email: string, token: string): Promise<"done" | "invalid" | "error"> {
  if (!email || !token || !verifyUnsubscribe(email, token)) return "invalid";
  const db = createServiceClient();
  if (!db) return "error";
  const { error } = await db
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase())
    .is("unsubscribed_at", null);
  return error ? "error" : "done";
}

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  let result: "done" | "invalid" | "error";
  try {
    result = await unsubscribe(email, token);
  } catch {
    result = "error";
  }

  const copy = {
    done: { title: "You've been unsubscribed", body: `${email} won't receive the Kahaani letter any more. Changed your mind? You can sign up again from the home page.` },
    invalid: { title: "This link isn't valid", body: "The unsubscribe link is incomplete or has been altered. Please use the link from your most recent email." },
    error: { title: "Something went wrong", body: "We couldn't process your request right now. Please try again in a few minutes." },
  }[result];

  return (
    <section className="bg-dark">
      <div className="container-site flex min-h-[55vh] flex-col items-start justify-center py-16">
        <p className="eyebrow text-accent">The Kahaani Letter</p>
        <h1 className="mt-3 text-[36px] font-bold text-white md:text-[48px]">{copy.title}</h1>
        <p className="mt-4 max-w-lg text-cream/80">{copy.body}</p>
        <LinkButton href="/" className="mt-8">
          Back to Kanpur Ki Kahaani
        </LinkButton>
      </div>
    </section>
  );
}
