"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import type { Slide } from "@/data/images";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";

/**
 * Full-bleed cross-fading hero. Text stays fixed while images fade.
 * Autoplay 6s, pauses on hover/focus, swipeable, keyboard-operable arrows and dots.
 */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [autoplay] = useState(() =>
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }),
  );
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, duration: 30 }, [Fade(), autoplay]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    // Respect reduced motion: no autoplay
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) autoplay.stop();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, autoplay]);

  const go = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Kanpur highlights"
      className="relative h-[85vh] min-h-[520px] max-h-[860px] overflow-hidden bg-dark"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") embla?.scrollPrev();
        if (e.key === "ArrowRight") embla?.scrollNext();
      }}
    >
      <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {slides.map((s, i) => (
            <div
              key={s.image}
              className="relative h-full min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${s.caption}`}
              aria-hidden={i !== index}
            >
              <ImageWithFallback
                src={s.image}
                alt={s.alt}
                label={s.label}
                tone={i % 2 ? "dusk" : "warm"}
                fill
                hideLabel
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      {/* left-heavy gradient for legibility */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/55 to-dark/10" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-dark/70 to-transparent" />

      <div className="container-site relative flex h-full flex-col justify-center">
        <div className="max-w-2xl">
          <p className="eyebrow text-accent">Kanpur · Uttar Pradesh · India</p>
          <h1 className="mt-4 text-[44px] font-bold leading-[1.02] tracking-tight text-white sm:text-[56px] md:text-[68px]">
            Kanpur Ki Kahaani
          </h1>
          <p className="mt-4 max-w-lg font-display text-lg italic text-cream/85 md:text-2xl">
            The Stories of the Manchester of the East
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tourism"
              className={buttonClass("primary", "px-7")}
              onClick={() => track("hero_cta_click", { cta: "explore_kanpur" })}
            >
              Explore Kanpur
            </Link>
            <Link
              href="/tourism#planner"
              className={buttonClass("outline-light", "px-7")}
              onClick={() => track("hero_cta_click", { cta: "plan_your_trip" })}
            >
              Plan Your Trip
            </Link>
          </div>
          <p className="mt-10 text-xs uppercase tracking-[0.18em] text-cream/70" aria-live="polite">
            {slides[index]?.caption}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => embla?.scrollPrev()}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-dark/30 text-white backdrop-blur transition hover:bg-white hover:text-ink md:inline-flex lg:left-6"
      >
        <ChevronLeft aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => embla?.scrollNext()}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-dark/30 text-white backdrop-blur transition hover:bg-white hover:text-ink md:inline-flex lg:right-6"
      >
        <ChevronRight aria-hidden />
      </button>

      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2" role="group" aria-label="Choose slide">
        {slides.map((s, i) => (
          <button
            key={s.image}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}: ${s.caption}`}
            aria-current={i === index}
            className="flex h-6 items-center"
          >
            <span
              className={cn(
                "block h-2 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-accent" : "w-2 bg-white/60 hover:bg-white",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
