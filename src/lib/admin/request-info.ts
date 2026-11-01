import "server-only";
import { headers } from "next/headers";

/** Caller IP (Vercel sets x-forwarded-for / x-real-ip). */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** Public origin of this request (works on production, previews and localhost). */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kanpurkikahaani.site");
}
