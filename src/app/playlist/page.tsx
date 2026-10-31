import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { SpotifyEmbed } from "@/components/sections/SpotifyEmbed";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InlineLink } from "@/components/ui/InlineLink";
import { playlist, playlistUrl } from "@/data/playlist";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kanpur City Playlist – The Sound of Kanpur | Kanpur Ki Kahaani",
  description:
    "Kanpur's on aux. Press play on the Kanpur Ki Kahaani Spotify playlist — the soundtrack for chai breaks, ghat sunsets, late-night rides and hostel rooftops.",
  path: "/playlist",
  ogImage: "/og/playlist",
});

export default function PlaylistPage() {
  return (
    <>
      <PageHero
        eyebrow="Live"
        title="City Playlist"
        subtitle="Kanpur's on aux. Hit play — main character energy, Kanpur edition. 🎧"
        crumbs={[{ name: "Live", href: "/events" }, { name: "City Playlist" }]}
      />
      <Section labelledBy="listen-title">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            id="listen-title"
            eyebrow="Listen"
            title={playlist.title}
            intro="Chai breaks, ghat sunsets, late-night rides — no skips, just vibes."
          />
          <SpotifyEmbed id={playlist.spotifyPlaylistId} title={playlist.title} searchQuery={playlist.searchQuery} />
          <p className="mt-5 text-sm">
            <InlineLink href={playlistUrl} external>
              Open in Spotify &amp; follow the playlist
            </InlineLink>
          </p>
        </div>
      </Section>
    </>
  );
}
