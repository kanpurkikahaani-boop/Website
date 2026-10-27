import Link from "next/link";
import { FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/ui/BrandIcons";
import { navGroups } from "@/data/nav";
import { site } from "@/data/site";
import { Logo } from "./Logo";

const socials = [
  { label: "Instagram", href: site.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: site.social.facebook, Icon: FacebookIcon },
  { label: "YouTube", href: site.social.youtube, Icon: YouTubeIcon },
];

export function Footer() {
  return (
    <footer className="bg-dark text-cream/75">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(5,1fr)] lg:gap-8">
        <div className="md:col-span-2 lg:col-span-1">
          <Logo tone="dark" size={44} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">{site.description}</p>
          <ul className="mt-5 flex gap-2.5" aria-label="Social media">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${site.name} on ${label} (opens in a new tab)`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/30 text-cream transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon size={17} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <FooterCol title="Home" links={[{ label: "Home", href: "/" }, { label: "How to Reach", href: "/#reach" }, { label: "Stories", href: "/#stories" }, { label: "Newsletter", href: "/#newsletter" }]} />
        {navGroups.map((g) => (
          <FooterCol key={g.label} title={g.label} links={g.items} />
        ))}
      </div>
      <div className="border-t border-cream/10">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-cream/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {site.year} {site.name} · Created for an academic digital marketing project</p>
          <Link href="/privacy" className="hover:text-accent">
            Privacy
          </Link>
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
