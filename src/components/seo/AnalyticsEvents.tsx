"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Outbound clicks (v10): any link to another website sends `outbound_click` with the link's
 * address, domain and text. Sent with the beacon transport so it survives the page change.
 * Only mounted when GA4 is configured (NEXT_PUBLIC_GA_ID).
 */
export function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (!/^https?:$/.test(url.protocol) || url.host === location.host) return;
      track("outbound_click", {
        link_url: url.href.slice(0, 300),
        link_domain: url.hostname,
        link_text: (a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 100),
        page_path: location.pathname,
        transport_type: "beacon",
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
