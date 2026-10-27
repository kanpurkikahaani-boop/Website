"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { Tabs } from "@/components/ui/Tabs";
import { ImageCard, type ImageCardProps } from "@/components/ui/ImageCard";
import { useQueryState } from "@/lib/url-state";

export interface FilterableItem {
  key: string;
  /** values this item matches (an item can belong to several filters) */
  tags: string[];
  card: Omit<ImageCardProps, "onClick">;
}

interface Props {
  items: FilterableItem[];
  options: { value: string; label: string }[];
  /** URL query key, e.g. "month" or "tab" */
  param: string;
  label: string;
  mode?: "pills" | "tabs";
  /** default option value; "all" shows everything */
  fallback?: string;
  emptyText?: string;
}

/**
 * Generic card grid with pills or ARIA tabs, synced to `?{param}=`.
 * The default view is the Suspense fallback so it's present in the static HTML.
 */
export function FilterableCards(props: Props) {
  const fallback = props.fallback ?? props.options[0].value;
  return (
    <Suspense fallback={<View {...props} value={fallback} />}>
      <WithQuery {...props} />
    </Suspense>
  );
}

function WithQuery(props: Props) {
  const fallback = props.fallback ?? props.options[0].value;
  const [value, setValue] = useQueryState(
    props.param,
    props.options.map((o) => o.value),
    fallback,
  );
  return <View {...props} value={value} onChange={setValue} />;
}

function View({
  items,
  options,
  label,
  mode = "pills",
  param,
  value,
  onChange,
  emptyText = "Nothing here yet — try another filter.",
}: Props & { value: string; onChange?: (v: string) => void }) {
  const reduce = useReducedMotion();
  const set = onChange ?? (() => {});
  const shown = value === "all" ? items : items.filter((i) => i.tags.includes(value));
  const idPrefix = `fc-${param}`;

  return (
    <>
      {mode === "tabs" ? (
        <div className="mb-8">
          <Tabs tabs={options} value={value} onChange={set} label={label} idPrefix={idPrefix} />
        </div>
      ) : (
        <FilterPills options={options} value={value} onChange={set} label={label} className="mb-8" />
      )}
      <div
        id={`${idPrefix}-panel`}
        role={mode === "tabs" ? "tabpanel" : undefined}
        aria-labelledby={mode === "tabs" ? `${idPrefix}-tab-${value}` : undefined}
      >
        <p className="sr-only" aria-live="polite">
          Showing {shown.length} results
        </p>
        {shown.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center">{emptyText}</p>}
        <motion.ul layout={!reduce} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((it) => (
              <motion.li
                key={it.key}
                id={it.key}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="scroll-mt-28"
              >
                <ImageCard {...it.card} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </>
  );
}
