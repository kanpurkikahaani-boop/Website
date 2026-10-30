import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { absoluteUrl } from "@/data/site";

function secret() {
  const s = process.env.UNSUBSCRIBE_SECRET;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET is not set");
  return s;
}

/** HMAC-SHA256 token for an email address (lower-cased). */
export function signUnsubscribe(email: string) {
  return createHmac("sha256", secret()).update(email.trim().toLowerCase()).digest("base64url");
}

export function verifyUnsubscribe(email: string, token: string) {
  try {
    const expected = Buffer.from(signUnsubscribe(email));
    const given = Buffer.from(token);
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

/** The link to put in every newsletter email. */
export function unsubscribeUrl(email: string) {
  const e = email.trim().toLowerCase();
  return absoluteUrl(`/unsubscribe?email=${encodeURIComponent(e)}&token=${signUnsubscribe(e)}`);
}
