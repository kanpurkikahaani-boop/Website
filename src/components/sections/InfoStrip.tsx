import type { LucideIcon } from "lucide-react";
import { IconBadge } from "@/components/ui/IconBadge";

export interface InfoItem {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}

/** Dark strip of 4 facts with gold icon badges. */
export function InfoStrip({ items, label }: { items: InfoItem[]; label: string }) {
  return (
    <section aria-label={label} className="bg-dark">
      <div className="container-site">
        <ul className="grid grid-cols-1 divide-y divide-cream/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-3.5 py-5 sm:py-6 lg:px-6 lg:first:pl-0">
              <IconBadge icon={it.icon} size={40} className="bg-accent/15" />
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-accent">{it.label}</p>
                <p className="mt-0.5 text-[15px] font-medium text-cream">{it.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
