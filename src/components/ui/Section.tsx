import { cn } from "@/lib/utils";

type Tone = "bg" | "alt" | "dark" | "white";

const tones: Record<Tone, string> = {
  bg: "bg-bg",
  alt: "bg-bg-alt",
  dark: "bg-dark",
  white: "bg-surface",
};

export function Section({
  tone = "bg",
  className,
  children,
  id,
  labelledBy,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("section-pad", tones[tone], className)}>
      <div className="container-site">{children}</div>
    </section>
  );
}
