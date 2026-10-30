"use client";

import { useEffect } from "react";

/** Switches Hindi text to Noto Serif Devanagari once the page has loaded and the browser is idle. */
export function DevaFontLoader() {
  useEffect(() => {
    const enable = () => document.documentElement.classList.add("deva-ready");
    const idle = () => ("requestIdleCallback" in window ? window.requestIdleCallback(enable, { timeout: 3000 }) : setTimeout(enable, 1500));
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }, []);
  return null;
}
