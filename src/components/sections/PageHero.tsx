import { Breadcrumbs } from "./Breadcrumbs";
import type { Crumb } from "@/lib/seo";

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Crumbs after "Home" — e.g. [{name:"Explore", href:"/tourism"}, {name:"Tourism"}] */
  crumbs: Crumb[];
  children?: React.ReactNode;
}

/** Dark band with warm glow, gold eyebrow, white H1, cream subtitle, then breadcrumbs. */
export function PageHero({ eyebrow, title, subtitle, crumbs, children }: Props) {
  return (
    <>
      <section className="relative overflow-hidden bg-dark">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(200,144,46,0.38) 0%, rgba(142,43,30,0.22) 45%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(232,115,107,0.35), transparent 70%)" }}
        />
        <div className="container-site relative flex min-h-[260px] flex-col justify-center py-14 md:min-h-[300px] md:py-16">
          <p className="eyebrow text-accent">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-[38px] font-bold leading-[1.08] tracking-tight text-white md:text-[56px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-cream/75 md:text-base">{subtitle}</p>
          {children}
        </div>
      </section>
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, ...crumbs]} />
    </>
  );
}
