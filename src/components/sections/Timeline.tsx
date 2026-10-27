import { FadeUp } from "@/components/ui/FadeUp";

export interface TimelineEntry {
  label: string;
  title: string;
  body?: React.ReactNode;
}

/** Vertical timeline with a thin gold line and gold dots; entries fade in on scroll. */
export function Timeline({ entries, headingLevel: H = "h3" }: { entries: TimelineEntry[]; headingLevel?: "h3" | "h4" }) {
  return (
    <ol className="relative ml-2 border-l border-accent/50 pl-8">
      {entries.map((e, i) => (
        <FadeUp as="li" key={`${e.label}-${i}`} delay={Math.min(i * 0.05, 0.3)} className="relative pb-10 last:pb-0">
          <span
            aria-hidden
            className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-[3px] border-bg bg-accent ring-1 ring-accent/50"
          />
          <p className="eyebrow">{e.label}</p>
          <H className="mt-1 text-[22px] font-semibold leading-snug">{e.title}</H>
          {e.body && <div className="mt-1.5 max-w-xl text-[15px] leading-relaxed">{e.body}</div>}
        </FadeUp>
      ))}
    </ol>
  );
}
