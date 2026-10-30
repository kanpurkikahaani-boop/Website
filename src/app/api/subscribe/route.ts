import { NextResponse } from "next/server";
import { subscribeSchema, type SubscribeResult } from "@/lib/newsletter/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";

const json = (body: SubscribeResult, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** POST /api/subscribe — the single endpoint for the popup, home band and blog signups. */
export async function POST(req: Request) {
  const limit = rateLimit(`subscribe:${clientIp(req.headers)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return json({ status: "error", message: "Too many attempts — please try again in a few minutes." }, 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ status: "error", message: "Invalid request." }, 400);
  }

  // Honeypot filled → pretend success so bots learn nothing, but store nothing.
  if (typeof body === "object" && body && "website" in body && (body as { website?: unknown }).website) {
    return json({ status: "subscribed" });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.some((i) => i.path[0] === "email");
    return json({ status: "error", message: emailIssue ? "Please enter a valid email address." : "Please tick the consent box." }, 400);
  }
  const { email, cities, source } = parsed.data;

  const db = createServiceClient();
  if (!db) return json({ status: "error", message: "Signups are not open yet — please try again later." }, 503);

  const { data: existing, error: findErr } = await db
    .from("subscribers")
    .select("id, unsubscribed_at")
    .eq("email", email)
    .maybeSingle();
  if (findErr) return json({ status: "error", message: "Something went wrong. Please try again." }, 500);

  if (existing && !existing.unsubscribed_at) return json({ status: "exists" });

  const { error } = existing
    ? await db.from("subscribers").update({ unsubscribed_at: null, cities, source, consent: true }).eq("id", existing.id)
    : await db.from("subscribers").insert({ email, cities, source, consent: true });

  if (error) {
    // 23505 = unique violation (a parallel request won the race) → already subscribed
    if (error.code === "23505") return json({ status: "exists" });
    return json({ status: "error", message: "Something went wrong. Please try again." }, 500);
  }
  return json({ status: "subscribed" });
}
