import { Music } from "lucide-react";
import { isRealSpotifyId } from "@/data/playlist";

/** Responsive, lazy Spotify playlist embed; a styled link card until a real ID is set. */
export function SpotifyEmbed({ id, title, searchQuery }: { id: string; title: string; searchQuery: string }) {
  if (!isRealSpotifyId(id)) {
    return (
      <a
        href={`https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-h-[352px] flex-col items-center justify-center gap-4 rounded-2xl bg-[radial-gradient(circle_at_80%_10%,rgba(200,144,46,0.4),transparent_45%),linear-gradient(135deg,#3b1d16,#1c1412)] p-8 text-center text-cream"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1DB954] text-dark transition group-hover:scale-110">
          <Music size={28} aria-hidden />
        </span>
        <span className="font-display text-2xl text-white">{title}</span>
        <span className="text-sm text-cream/75">Open the playlist on Spotify ↗</span>
      </a>
    );
  }
  return (
    <iframe
      title={`${title} — Spotify playlist`}
      src={`https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`}
      width="100%"
      height="352"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className="rounded-2xl border-0"
    />
  );
}
