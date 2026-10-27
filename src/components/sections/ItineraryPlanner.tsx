"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Printer, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { cities } from "@/data/cities";
import { food } from "@/data/food";
import { kanpurPlaces } from "@/data/places";
import { absoluteUrl } from "@/data/site";
import type { Interest, NearbyCitySlug } from "@/data/types";
import { track } from "@/lib/analytics";
import { generateItinerary, planToText, type Plan } from "@/lib/itinerary";
import { cn } from "@/lib/utils";

const INTERESTS: { value: Interest; label: string }[] = [
  { value: "history", label: "History" },
  { value: "food", label: "Food" },
  { value: "nature", label: "Nature" },
  { value: "shopping", label: "Shopping" },
];

const pillBase = "rounded-full border px-4 py-2 text-sm font-medium transition-colors";

/** Planner with `?cities=` / `?days=` preselection (e.g. from the circuits on /nearby). */
export function ItineraryPlanner() {
  return (
    <Suspense fallback={<Planner preselected={[]} initialDays={null} />}>
      <PlannerWithParams />
    </Suspense>
  );
}

function PlannerWithParams() {
  const params = useSearchParams();
  const raw = params.get("cities") ?? "";
  const preselected = useMemo(
    () => cities.map((c) => c.slug).filter((s) => raw.split(",").includes(s)),
    [raw],
  );
  const d = Number(params.get("days"));
  return <Planner preselected={preselected} initialDays={d >= 1 && d <= 5 ? d : null} />;
}

function defaultDays(n: number) {
  return n === 0 ? 2 : Math.min(5, 1 + n * 2);
}

function Planner({ preselected, initialDays }: { preselected: NearbyCitySlug[]; initialDays: number | null }) {
  const reduce = useReducedMotion();
  const [days, setDays] = useState(() => initialDays ?? defaultDays(preselected.length));
  const [interests, setInterests] = useState<Interest[]>(["history", "food"]);
  const [chosen, setChosen] = useState<NearbyCitySlug[]>(preselected);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Re-sync when a circuit link changes ?cities= on the same page
  const [lastPre, setLastPre] = useState(preselected.join(","));
  if (lastPre !== preselected.join(",")) {
    setLastPre(preselected.join(","));
    setChosen(preselected);
    setDays(initialDays ?? defaultDays(preselected.length));
  }

  useEffect(() => {
    if (plan) resultRef.current?.focus();
  }, [plan]);

  function toggle<T>(list: T[], v: T) {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  function generate() {
    const p = generateItinerary({ days, interests, cities: chosen, places: kanpurPlaces, allCities: cities, food });
    setPlan(p);
    track("itinerary_generated", { days, interests: interests.join(","), cities: chosen.join(",") || "none" });
  }

  const shareUrl = absoluteUrl(
    `/tourism?days=${days}${chosen.length ? `&cities=${chosen.join(",")}` : ""}#planner`,
  );
  const text = plan ? planToText(plan, shareUrl) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("share_click", { network: "copy", context: "itinerary" });
    } catch {
      window.prompt("Copy your plan:", text);
    }
  }

  function print() {
    document.body.classList.add("printing-plan");
    const done = () => {
      document.body.classList.remove("printing-plan");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_50px_-30px_rgba(60,30,20,0.35)] md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <fieldset>
          <legend className="eyebrow mb-3">How many days?</legend>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Number of days">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={days === n}
                aria-label={`${n} day${n > 1 ? "s" : ""}`}
                onClick={() => setDays(n)}
                className={cn(
                  "h-12 w-12 rounded-full border text-base font-semibold transition-colors",
                  days === n ? "border-primary bg-primary text-white" : "border-border bg-bg text-ink hover:border-primary",
                )}
              >
                {n}
              </button>
            ))}
          </div>

          <p className="eyebrow mb-3 mt-8" id="interests-label">
            Your interests
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="interests-label">
            {INTERESTS.map((i) => {
              const on = interests.includes(i.value);
              return (
                <button
                  key={i.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setInterests((l) => toggle(l, i.value))}
                  className={cn(pillBase, on ? "border-accent bg-accent text-dark" : "border-border bg-bg text-ink hover:border-accent")}
                >
                  {i.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <p className="eyebrow mb-1" id="cities-label">
            Add a nearby city <span className="font-medium normal-case tracking-normal text-muted">(optional)</span>
          </p>
          <p className="mb-3 text-sm">Lucknow works as a day trip; the others are best with an overnight stay.</p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="cities-label">
            {cities.map((c) => {
              const on = chosen.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChosen((l) => toggle(l, c.slug))}
                  className={cn(pillBase, on ? "border-primary bg-primary text-white" : "border-border bg-bg text-ink hover:border-primary")}
                >
                  {c.name} <span className="ml-1 text-xs opacity-75">~{c.distanceKm} km</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={generate}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover sm:w-auto"
          >
            <Sparkles size={17} aria-hidden /> Generate My Plan
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {plan && (
          <motion.div
            key={plan.summary + plan.days.length}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="mt-10 border-t border-border pt-10"
          >
            <div
              id="planner-print-root"
              ref={resultRef}
              tabIndex={-1}
              aria-live="polite"
              aria-label="Your generated itinerary"
              className="outline-none"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="eyebrow">Your plan</p>
                  <h3 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{plan.summary}</h3>
                </div>
                <div className="no-print flex flex-wrap gap-2">
                  <button type="button" onClick={copy} className={cn(pillBase, "inline-flex items-center gap-2 border-border bg-bg text-ink hover:border-primary")}>
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied ? "Copied" : "Copy plan"}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("share_click", { network: "whatsapp", context: "itinerary" })}
                    className={cn(pillBase, "inline-flex items-center gap-2 border-[#25D366]/40 bg-[#25D366]/10 text-ink hover:bg-[#25D366]/20")}
                  >
                    <WhatsAppIcon size={16} /> Share on WhatsApp
                  </a>
                  <button type="button" onClick={print} className={cn(pillBase, "inline-flex items-center gap-2 border-border bg-bg text-ink hover:border-primary")}>
                    <Printer size={16} aria-hidden /> Print / Save as PDF
                  </button>
                </div>
              </div>

              <ol className="relative mt-8 ml-2 border-l border-accent/50 pl-8">
                {plan.days.map((d) => (
                  <li key={d.day} className="relative pb-10 last:pb-0">
                    <span aria-hidden className="absolute -left-[49px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-dark ring-4 ring-surface">
                      {d.day}
                    </span>
                    <p className="eyebrow">Day {d.day}</p>
                    <h4 className="mt-1 text-xl font-semibold">{d.title}</h4>
                    <ul className="mt-3 space-y-3">
                      {d.stops.map((s, i) => (
                        <li key={i} className="grid gap-1 rounded-xl bg-bg p-4 sm:grid-cols-[110px_1fr] sm:gap-4">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{s.slot}</span>
                          <span>
                            <span className="block font-semibold text-ink">
                              {s.href ? (
                                <Link href={s.href} className="hover:text-primary hover:underline">
                                  {s.title}
                                </Link>
                              ) : (
                                s.title
                              )}
                            </span>
                            <span className="text-sm">{s.note}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {d.tip && <p className="mt-3 text-sm italic text-muted">{d.tip}</p>}
                    {d.city !== "kanpur" && (
                      <Link href={`/cities/${d.city}`} className="no-print mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                        Explore the {cities.find((c) => c.slug === d.city)?.name} guide →
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
              {plan.skipped.length > 0 && (
                <p className="mt-6 rounded-xl bg-primary-soft p-4 text-sm text-primary">
                  Add more days to include {plan.skipped.join(", ")} — Kanpur always keeps at least one day.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
