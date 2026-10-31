import { timingSafeEqual } from "node:crypto";

/** Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`; compare in constant time. */
export function isAuthorizedCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
