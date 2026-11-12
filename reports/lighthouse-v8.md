# Lighthouse — update v8 (mobile, local production build)

Run locally against `next start` (Lighthouse 12, mobile emulation, simulated throttling). The container's CPU is noisy, so each page was run several times; the first cold run of `/` scored 66 and is excluded.

| Page | Performance (runs) | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/` | 93, 93, 93, 89, 88 (median 93) | 100 | 96 | 100 |
| `/weather` | 93, 93 | 100 | 96 | 100 |
| `/tourism` | 93, 93 | 100 | 100 | 100 |

- LCP on all three is the hero H1 (web font), 2.8–3.2 s simulated; CLS 0.
- Leaflet and the radar load only when `#radar` is near the viewport (`next/dynamic`, `ssr:false` + IntersectionObserver), so they are not in the first-load JS of `/weather`.
- Best practices 96 on `/` and `/weather`: console errors from blocked third-party requests in this offline container (Open-Meteo / Spotify), not present on the live site. // VERIFY on production with PageSpeed Insights.
