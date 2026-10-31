import { ArrowUpRight } from "lucide-react";
import type { DirectoryGroup } from "@/data/newsSources";
import { getVerifiedDirectory } from "@/lib/news/directory";
import { CITY_LABELS, NEWS_CITIES } from "@/lib/news/taxonomy";

const GROUPS: { id: DirectoryGroup; label: string }[] = [
  { id: "national-en", label: "National – English" },
  { id: "national-hi", label: "National – Hindi" },
  ...NEWS_CITIES.map((c) => ({ id: c as DirectoryGroup, label: CITY_LABELS[c].en })),
];

/** Server-rendered outbound links to the newspapers we follow (only URLs verified to return 200). */
export async function NewspaperDirectory() {
  const directory = await getVerifiedDirectory().catch(() => []);
  const groups = GROUPS.map((g) => ({ ...g, links: directory.filter((d) => d.group === g.id) })).filter((g) => g.links.length);
  return (
    <section aria-labelledby="directory-title" className="mt-16">
      <p className="eyebrow">Read more</p>
      <h2 id="directory-title" className="mt-2 text-[30px] font-bold leading-tight text-primary md:text-[36px]">Newspapers We Follow</h2>
      <p className="mt-2 max-w-xl">Go straight to the source — national dailies and the city desks covering Kanpur and its neighbours.</p>
      {groups.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-sm">
          Links to the newspapers we follow are loading — please check back shortly.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id} className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold">{g.label}</h3>
              <ul className="mt-3 space-y-1.5">
                {g.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-primary">
                      {l.name}
                      <ArrowUpRight size={14} aria-hidden className="text-muted group-hover:text-primary" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
