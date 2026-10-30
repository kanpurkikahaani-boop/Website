/**
 * Minimal analytics helper. Sends events to GA4 (gtag) and Meta Pixel (fbq)
 * when they are loaded — i.e. only when NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID are set.
 * Safe to call anywhere on the client; it is a no-op on the server.
 */
export type AnalyticsEvent =
  | "hero_cta_click"
  | "itinerary_generated"
  | "newsletter_signup"
  | "book_stay_click"
  | "video_play"
  | "city_card_click"
  | "share_click"
  | "social_click";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const pixelMap: Partial<Record<AnalyticsEvent, string>> = {
  newsletter_signup: "Lead",
  book_stay_click: "InitiateCheckout",
  itinerary_generated: "CustomizeProduct",
};

export function track(event: AnalyticsEvent, params: Params = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
    const std = pixelMap[event];
    if (std) window.fbq?.("track", std, params);
    else window.fbq?.("trackCustom", event, params);
  } catch {
    // never let analytics break the UI
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[track]", event, params);
  }
}
