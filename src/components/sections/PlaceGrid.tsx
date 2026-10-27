"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense } from "react";
import { ImageCard } from "@/components/ui/ImageCard";
import { FilterPills } from "@/components/ui/FilterPills";
import { placeCategories } from "@/data/places";
import type { Place, PlaceCategory } from "@/data/types";
import { useQueryState } from "@/lib/url-state";

type Filter = "all" | PlaceCategory;

interface Props {
  places: Place[];
  cityLabel: string;
}

function optionsFor(places: Place[]) {
  // only show categories that exist for this city
  const present = new Set(places.map((p) => p.category));
  return placeCategories.filter((c) => c.value === "all" || present.has(c.value));
}

/**
 * Filterable grid of place cards. Filter state lives in `?filter=` so views are shareable.
 * The unfiltered grid is the Suspense fallback, so every card is in the static HTML.
 */
export function PlaceGrid(props: Props) {
  return (
    <Suspense fallback={<PlaceGridView {...props} filter="all" />}>
      <PlaceGridWithQuery {...props} />
    </Suspense>
  );
}

function PlaceGridWithQuery(props: Props) {
  const [filter, setFilter] = useQueryState<Filter>(
    "filter",
    optionsFor(props.places).map((o) => o.value),
    "all",
  );
  return <PlaceGridView {...props} filter={filter} onChange={setFilter} />;
}

function PlaceGridView({ places, cityLabel, filter, onChange }: Props & { filter: Filter; onChange?: (f: Filter) => void }) {
  const options = optionsFor(places);
  const setFilter = onChange ?? (() => {});
  const reduce = useReducedMotion();
  const shown = filter === "all" ? places : places.filter((p) => p.category === filter);

  return (
    <>
      <FilterPills label={`Filter ${cityLabel} places by category`} options={options} value={filter} onChange={setFilter} className="mb-8" />
      <p className="sr-only" aria-live="polite">
        Showing {shown.length} places
      </p>
      <motion.ul layout={!reduce} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p) => (
            <motion.li
              key={p.slug}
              id={p.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="scroll-mt-28"
            >
              <ImageCard
                image={p.image}
                alt={p.alt}
                imageLabel={p.name}
                imageSublabel={cityLabel}
                eyebrow={p.category}
                title={p.name}
                description={p.description}
                chips={[p.area, p.duration]}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </>
  );
}
