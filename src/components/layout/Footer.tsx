import Link from "next/link";
import { navGroups } from "@/data/nav";
import { site } from "@/data/site";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return (
    <footer className="bg-dark text-cream/75">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(5,1fr)] lg:gap-8">
        <div className="md:col-span-2 lg:col-span-1">
          <Logo tone="dark" size={44} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">{site.description}</p>
          <SocialLinks variant="footer" className="mt-5" />
        </div>
        <FooterCol title="Home" links={[{ label: "Home", href: "/" }, { label: "How to Reach", href: "/#reach" }, { label: "Blogs", href: "/blogs" }, { label: "Newsletter", href: "/#newsletter" }]} />
        {navGroups.map((g) => (
          <FooterCol key={g.label} title={g.label} links={g.items} />
        ))}
      </div>
      <div className="border-t border-cream/10">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-cream/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {site.year} {site.name} · Created for an academic digital marketing project</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-accent">
              Privacy
            </Link>
            <Link href="/admin/login" rel="nofollow" className="text-cream/65 hover:text-accent">
              Team login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="font-sans text-[11.5px] font-bold uppercase tracking-[0.2em] text-accent">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-cream/75 transition-colors hover:text-accent">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
