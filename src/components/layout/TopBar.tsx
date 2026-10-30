import { SocialLinks } from "./SocialLinks";

/** Slim dark utility bar above the navbar: cities on the left, "Follow us" + socials on the right. */
export function TopBar() {
  return (
    <div className="bg-dark">
      <div className="container-site flex h-9 items-center justify-end gap-4 sm:justify-between">
        <p className="hidden truncate text-[12px] tracking-wide text-cream/80 sm:block">
          Kanpur · Lucknow · Agra · Prayagraj · Varanasi · Ayodhya
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-accent sm:inline">Follow us</span>
          <SocialLinks variant="bar" />
        </div>
      </div>
    </div>
  );
}
