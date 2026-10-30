"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import type { SubscribeResult, SubscribeSource } from "./schema";

export type SubscribeState = "idle" | "loading" | "subscribed" | "exists" | "error";

export const SUBSCRIBED_KEY = "kkk-nl-subscribed";

/** Shared client logic for every signup form: posts to /api/subscribe and tracks the result. */
export function useSubscribe(source: SubscribeSource) {
  const [state, setState] = useState<SubscribeState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function subscribe(input: { email: string; cities?: string[]; website?: string }) {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, cities: input.cities ?? [], source, consent: true }),
      });
      const data = (await res.json()) as SubscribeResult;
      if (data.status === "subscribed" || data.status === "exists") {
        setState(data.status);
        setMessage(data.status === "exists" ? "You're already on the list!" : "You're in! Watch your inbox.");
        track("newsletter_signup", { source, result: data.status });
        try {
          localStorage.setItem(SUBSCRIBED_KEY, "1");
        } catch {
          // storage unavailable — fine
        }
        return data.status;
      }
      setState("error");
      setMessage("message" in data ? data.message : "Something went wrong. Please try again.");
    } catch {
      setState("error");
      setMessage("Couldn't reach the server. Please check your connection and try again.");
    }
    return "error" as const;
  }

  return { state, message, subscribe, setMessage, setState };
}
