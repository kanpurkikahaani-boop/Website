import "server-only";
import { unstable_cache } from "next/cache";
import { directoryCandidates, type DirectoryLink } from "@/data/newsSources";

const UA = "Mozilla/5.0 (compatible; KanpurKiKahaaniBot/1.0; +https://kanpurkikahaani.site)";

async function isLive(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: ctrl.signal, cache: "no-store" });
    await res.body?.cancel(); // only the status matters
    return res.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/** Newspaper links that currently return HTTP 200 — re-checked at most once an hour. */
export const getVerifiedDirectory = unstable_cache(
  async (): Promise<DirectoryLink[]> => {
    const results = await Promise.all(directoryCandidates.map((d) => isLive(d.url)));
    return directoryCandidates.filter((_, i) => results[i]);
  },
  ["news-directory-v1"],
  { revalidate: 3600, tags: ["news"] },
);
