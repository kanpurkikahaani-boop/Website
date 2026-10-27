"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { isRealVideoId } from "@/data/videos";
import { track } from "@/lib/analytics";

/**
 * Lite YouTube embed: shows a thumbnail + play button and loads the iframe only on click.
 * With a placeholder ID, the poster links to a YouTube search for the caption instead.
 */
export function LiteYouTube({ id, title }: { id: string; title: string }) {
  const [active, setActive] = useState(false);
  const real = isRealVideoId(id);

  if (active && real) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const poster = (
    <>
      {real ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail, lazy
        <img
          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(200,144,46,0.45),transparent_50%),linear-gradient(135deg,#5c2a1f,#1c1412)]"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-xl transition group-hover:scale-110">
          <Play size={26} fill="currentColor" aria-hidden className="ml-1" />
        </span>
      </span>
    </>
  );

  if (!real) {
    return (
      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("video_play", { title, mode: "search" })}
        className="group relative block aspect-video overflow-hidden rounded-2xl"
        aria-label={`Watch: ${title} on YouTube (opens in a new tab)`}
      >
        {poster}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setActive(true);
        track("video_play", { title, id });
      }}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-black"
      aria-label={`Play video: ${title}`}
    >
      {poster}
    </button>
  );
}
