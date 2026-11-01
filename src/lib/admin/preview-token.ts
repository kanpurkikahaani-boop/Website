import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Signed, 1-hour preview tokens: base64url("postId.expiry").signature (HMAC-SHA256, PREVIEW_SECRET). */
const TTL_MS = 60 * 60 * 1000;

function secret() {
  const s = process.env.PREVIEW_SECRET;
  return s && s.length >= 16 ? s : null;
}

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

export function createPreviewToken(postId: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(`${postId}.${now + TTL_MS}`).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

/** The post id the token was issued for, or null if it's forged, malformed or expired. */
export function verifyPreviewToken(token: string | undefined | null, now = Date.now()): string | null {
  const key = secret();
  if (!key || !token || token.length > 300) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const [postId, exp] = Buffer.from(payload, "base64url").toString().split(".");
  if (!postId || !Number(exp) || Number(exp) < now) return null;
  return postId;
}
