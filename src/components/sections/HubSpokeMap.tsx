import Link from "next/link";
import { cities, kanpurInfo } from "@/data/cities";

/**
 * Custom SVG hub-and-spoke map: Kanpur in the centre, the five cities placed by
 * approximate geography, curved connectors labelled with road distance.
 */
export function HubSpokeMap() {
  const W = 1000;
  const H = 620;
  const pos = (p: { x: number; y: number }) => ({ x: (p.x / 100) * (W - 160) + 80, y: (p.y / 100) * (H - 140) + 70 });
  const hub = pos(kanpurInfo.mapPos);

  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-surface">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-labelledby="hub-map-title hub-map-desc" className="h-auto w-full">
        <title id="hub-map-title">Map of trips from Kanpur</title>
        <desc id="hub-map-desc">
          Kanpur at the centre with routes to {cities.map((c) => `${c.name} (~${c.distanceKm} km)`).join(", ")}.
        </desc>
        <defs>
          <pattern id="hub-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#efe4da" strokeWidth="1" />
          </pattern>
          <radialGradient id="hub-glow">
            <stop offset="0%" stopColor="#c8902e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c8902e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="#fcf8f4" />
        <rect width={W} height={H} fill="url(#hub-grid)" />
        {/* stylised Ganga */}
        <path
          d="M 60 120 C 220 180, 300 260, 420 300 S 640 420, 760 470 S 900 520, 960 600"
          fill="none"
          stroke="#cfdcd6"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.8"
        />
        <text x="640" y="402" fill="#6f8a80" fontSize="15" fontStyle="italic" transform="rotate(24 640 402)">
          Ganga
        </text>

        {cities.map((c) => {
          const p = pos(c.mapPos);
          const mx = (hub.x + p.x) / 2;
          const my = (hub.y + p.y) / 2;
          // perpendicular offset for a gentle curve
          const dx = p.x - hub.x;
          const dy = p.y - hub.y;
          const len = Math.hypot(dx, dy) || 1;
          const cx = mx - (dy / len) * 50;
          const cy = my + (dx / len) * 50;
          const lx = 0.25 * hub.x + 0.5 * cx + 0.25 * p.x;
          const ly = 0.25 * hub.y + 0.5 * cy + 0.25 * p.y;
          return (
            <g key={c.slug}>
              <path d={`M ${hub.x} ${hub.y} Q ${cx} ${cy} ${p.x} ${p.y}`} fill="none" stroke="#c8902e" strokeWidth="2.5" strokeDasharray="7 7" />
              <g transform={`translate(${lx} ${ly})`}>
                <rect x="-38" y="-15" width="76" height="30" rx="15" fill="#fff" stroke="#efe4da" />
                <text textAnchor="middle" y="5" fontSize="14" fontWeight="700" fill="#8e2b1e">
                  {c.distanceKm} km
                </text>
              </g>
            </g>
          );
        })}

        <circle cx={hub.x} cy={hub.y} r="90" fill="url(#hub-glow)" />
        <Link href="/tourism" aria-label="Kanpur — tourism guide">
          <circle cx={hub.x} cy={hub.y} r="34" fill="#8e2b1e" stroke="#fff" strokeWidth="4" />
          <text x={hub.x} y={hub.y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
            HUB
          </text>
          <text x={hub.x} y={hub.y + 62} textAnchor="middle" fontSize="22" fontWeight="700" fill="#2a1e1a" fontFamily="var(--font-playfair), serif">
            Kanpur
          </text>
        </Link>

        {cities.map((c) => {
          const p = pos(c.mapPos);
          const below = p.y > hub.y;
          return (
            <Link key={c.slug} href={`/cities/${c.slug}`} aria-label={`${c.name}, about ${c.distanceKm} km from Kanpur`} className="group">
              <circle cx={p.x} cy={p.y} r="26" fill="#fbefd9" stroke="#c8902e" strokeWidth="3" className="transition-all group-hover:fill-[#c8902e]" />
              <circle cx={p.x} cy={p.y} r="8" fill="#8e2b1e" />
              <text
                x={p.x}
                y={below ? p.y + 52 : p.y - 38}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill="#2a1e1a"
                fontFamily="var(--font-playfair), serif"
                className="group-hover:fill-[#8e2b1e]"
              >
                {c.name}
              </text>
              <text x={p.x} y={below ? p.y + 72 : p.y - 60} textAnchor="middle" fontSize="13" fill="#6f5f57">
                {c.driveTime} by road
              </text>
            </Link>
          );
        })}
      </svg>
      <figcaption className="border-t border-border px-5 py-3 text-xs text-muted">
        Positions are approximate. Distances are typical road distances from Kanpur and may vary by route.
      </figcaption>
    </figure>
  );
}
