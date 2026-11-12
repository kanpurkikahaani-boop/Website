"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Live rain radar: OpenStreetMap base + RainViewer radar frames (about the past two hours),
 * with play/pause. Loaded only when scrolled near (see LazyRainRadar). If RainViewer can't be
 * reached, the parent shows a link to IMD's official radar instead (onFail).
 *
 * Terms (see SETUP.md → Weather): OSM tiles need visible attribution and light use; RainViewer's
 * free public API needs attribution and caps the radar zoom level. // VERIFY current terms.
 */
interface Frame {
  time: number;
  path: string;
}

const RADAR_MAX_ZOOM = 7; // RainViewer free API zoom cap. // VERIFY
const istClock = (t: number) => new Date(t * 1000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

export default function RainRadar({ lat, lon, place, onFail }: { lat: number; lon: number; place: string; onFail: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.TileLayer[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Map + radar frames (once).
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { center: [lat, lon], zoom: 7, maxZoom: 10, scrollWheelZoom: false, attributionControl: true });
    map.current = m;
    m.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(m);
    let cancelled = false;
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { host: string; radar?: { past?: Frame[] } }) => {
        if (cancelled) return;
        const past = (j.radar?.past ?? []).slice(-12); // ~2 hours of 10-minute frames
        if (!past.length || !j.host) throw new Error("no frames");
        layers.current = past.map((f, i) =>
          L.tileLayer(`${j.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`, {
            opacity: i === past.length - 1 ? 0.75 : 0,
            maxNativeZoom: RADAR_MAX_ZOOM,
            maxZoom: 10,
            zIndex: 10 + i,
            attribution: i === 0 ? 'Radar © <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>' : undefined,
          }).addTo(m),
        );
        setFrames(past);
        setIndex(past.length - 1);
      })
      .catch(() => !cancelled && onFail());
    return () => {
      cancelled = true;
      m.remove();
      map.current = null;
      layers.current = [];
    };
    // The map is created once; re-centring is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the selected place.
  useEffect(() => {
    map.current?.setView([lat, lon], map.current.getZoom());
    const m = map.current;
    if (!m) return;
    const dot = L.circleMarker([lat, lon], { radius: 6, color: "#8e2b1e", weight: 2, fillColor: "#c8902e", fillOpacity: 1 }).bindTooltip(place).addTo(m);
    return () => {
      dot.remove();
    };
  }, [lat, lon, place]);

  // Show one frame at a time.
  useEffect(() => {
    layers.current.forEach((l, i) => l.setOpacity(i === index ? 0.75 : 0));
  }, [index, frames]);

  // Animation.
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % frames.length), 700);
    return () => clearInterval(t);
  }, [playing, frames.length]);

  const frame = frames[index];
  return (
    <div>
      <div ref={el} className="h-[340px] w-full overflow-hidden rounded-3xl border border-border bg-surface md:h-[440px]" role="region" aria-label={`Rain radar map around ${place}`} />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={frames.length < 2}
          aria-pressed={playing}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral disabled:opacity-50"
        >
          {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
          {playing ? "Pause" : "Play last 2 hours"}
        </button>
        <span aria-live="polite" className="text-muted">
          {frame ? `Radar at ${istClock(frame.time)} IST${index === frames.length - 1 ? " (latest)" : ""}` : "Loading radar…"}
        </span>
      </div>
    </div>
  );
}
