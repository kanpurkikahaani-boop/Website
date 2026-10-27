"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Keeps a single-select filter in the URL query (e.g. `?filter=heritage`) so filtered
 * views are shareable. The default value is removed from the URL to keep links clean.
 * Components using this must be rendered inside <Suspense>.
 */
export function useQueryState<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get(key);
  const value = (raw && (allowed as readonly string[]).includes(raw) ? raw : fallback) as T;

  const setValue = useCallback(
    (next: T) => {
      const sp = new URLSearchParams(params.toString());
      if (next === fallback) sp.delete(key);
      else sp.set(key, next);
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}${window.location.hash}`, { scroll: false });
    },
    [params, router, pathname, key, fallback],
  );

  return [value, setValue] as const;
}
