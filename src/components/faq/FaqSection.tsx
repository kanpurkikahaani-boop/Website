import { JsonLd } from "@/components/seo/JsonLd";
import type { FaqItem } from "@/data/faqs";
import { plainAnswer, renderAnswer } from "@/lib/faq-text";
import { faqJsonLd } from "@/lib/seo";
import type { WeatherPlace } from "@/lib/weather-place";
import { cn } from "@/lib/utils";
import { CopyFaqLink, FaqHashOpener, LiveFaqLine } from "./FaqClient";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

interface Props {
  title: string;
  items: FaqItem[];
  eyebrow?: string;
  intro?: string;
  id?: string;
  /** Group order for grouped mode (Weather). Items are placed by their `group`. */
  groups?: readonly string[];
  /** Coordinates for live weather lines (items with `live`). */
  livePlace?: WeatherPlace;
  /** Live lines follow the place picked on /weather. */
  followSelectedPlace?: boolean;
  /** Output FAQPage JSON-LD (off on /faq, which emits its own). */
  jsonLd?: boolean;
  /** Prefix for question anchors when several FAQ lists share one page (/faq). */
  anchorPrefix?: string;
  className?: string;
  /** Plain section without the beige band / outer padding (used inside /faq). */
  bare?: boolean;
}

/**
 * Crawlable FAQ: native <details>/<summary> (answers are in the server HTML and work without
 * JavaScript), first item open, deep links (#faq-…), optional groups, optional live weather lines.
 */
export function FaqSection({ title, items, eyebrow = "Good to know", intro, id = "faq", groups, livePlace, followSelectedPlace, jsonLd = true, anchorPrefix = "faq-", className, bare }: Props) {
  const grouped = groups?.length ? groups.map((g) => ({ g, list: items.filter((i) => i.group === g) })).filter((x) => x.list.length) : [{ g: "", list: items }];
  const titleId = `${id}-title`;
  let index = 0;

  const item = (f: FaqItem) => {
    const anchor = `${anchorPrefix}${f.id}`;
    const first = index++ === 0;
    return (
      <details key={f.id} id={anchor} open={first} className="faq-item group/faq scroll-mt-28 rounded-xl border border-border bg-white">
        <summary className="flex cursor-pointer list-none items-start gap-3 rounded-xl px-5 py-4 text-[17px] font-semibold leading-snug text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral [&::-webkit-details-marker]:hidden">
          <span className="flex-1">{f.question}</span>
          <CopyFaqLink anchor={anchor} question={f.question} />
          <span aria-hidden className="faq-plus mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center text-[22px] font-normal leading-none text-accent-ink transition-transform duration-300">
            +
          </span>
        </summary>
        <div className="px-5 pb-5 text-[15.5px] leading-relaxed text-muted">
          <p>{renderAnswer(f.answer)}</p>
          {f.live && livePlace && <LiveFaqLine token={f.live} place={livePlace} follow={followSelectedPlace} />}
        </div>
      </details>
    );
  };

  const body = (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-8 text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={titleId} className="mt-2 text-[28px] font-bold leading-tight text-primary md:text-[34px]">{title}</h2>
        {intro && <p className="mx-auto mt-3 max-w-[620px] text-[16px]">{intro}</p>}
      </div>
      {groups?.length ? (
        <>
          <nav aria-label="FAQ topics" className="mb-8 flex flex-wrap justify-center gap-2">
            {grouped.map(({ g }) => (
              <a key={g} href={`#${id}-${slug(g)}`} className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral">
                {g}
              </a>
            ))}
          </nav>
          {grouped.map(({ g, list }) => (
            <div key={g} className="mb-10 last:mb-0">
              <h3 id={`${id}-${slug(g)}`} className="mb-3 scroll-mt-28 text-[13px] font-bold uppercase tracking-[0.16em] text-accent-ink">{g}</h3>
              <div className="space-y-3">{list.map(item)}</div>
            </div>
          ))}
        </>
      ) : (
        <div className="space-y-3">{items.map(item)}</div>
      )}
      <FaqHashOpener />
      {jsonLd && <JsonLd data={faqJsonLd(items.map((f) => ({ question: f.question, answerText: plainAnswer(f.answer) })))} />}
    </div>
  );

  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} aria-labelledby={titleId} className={cn("bg-bg-alt py-16 md:py-20", className)}>
      <div className="container-site">{body}</div>
    </section>
  );
}
