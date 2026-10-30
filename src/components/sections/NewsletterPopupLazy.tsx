"use client";

import dynamic from "next/dynamic";

// The popup only matters after 8s / 40% scroll, so keep it out of the initial JS bundle.
const NewsletterPopup = dynamic(() => import("./NewsletterPopup").then((m) => m.NewsletterPopup), { ssr: false });

export function NewsletterPopupLazy() {
  return <NewsletterPopup />;
}
