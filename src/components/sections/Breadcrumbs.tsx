import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";

/** Visible breadcrumb row + BreadcrumbList JSON-LD. Last crumb is the current page. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="border-b border-border/60 bg-bg">
      <nav aria-label="Breadcrumb" className="container-site py-3.5">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px]">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.name}-${i}`} className="inline-flex items-center gap-1.5">
                {last || !c.href ? (
                  <span aria-current={last ? "page" : undefined} className={last ? "font-semibold text-primary" : "text-muted"}>
                    {c.name}
                  </span>
                ) : (
                  <Link href={c.href} className="text-muted hover:text-primary">
                    {c.name}
                  </Link>
                )}
                {!last && <ChevronRight size={13} className="text-muted/70" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </div>
  );
}
