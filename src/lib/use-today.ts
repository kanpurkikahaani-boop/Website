"use client";

import { useSyncExternalStore } from "react";
import { todayISTISO } from "./utils";

const noop = () => () => {};

/** Today's date (YYYY-MM-DD, IST) on the client; null during static render/hydration. */
export function useToday(): string | null {
  return useSyncExternalStore(noop, todayISTISO, () => null);
}
