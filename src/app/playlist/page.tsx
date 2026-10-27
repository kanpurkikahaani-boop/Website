import type { Metadata } from "next";
import { Music2 } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { SpotifyEmbed } from "@/components/sections/SpotifyEmbed";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconBadge } from "@/components/ui/IconBadge";
import { playlist } from "@/data/playlist";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kanpur City Playlist – The Sound of Kanpur | Kanpur Ki Kahaani",
  description:
    "Press play on the sound of Kanpur: thumri and kajri from the old city, mehfil memories and the indie and lo-fi energy of its campuses, in one Spotify playlist.",
  path: "/playlist",
  ogImage: "/og/playlist",
});

export default function PlaylistPage() {
  return (
    <>
      <PageHero
        eyebrow="Live"
        title="City Playlist"
        subtitle="Press play and let Kanpur hum along — from old-city thumri moods to the indie energy of its campuses."
        crumbs={[{ name: "Live", href: "/events" }, { name: "City Playlist" }]}
      />
      <Section labelledBy="listen-title">
        <div className="mx-auto max-w-3xl">
          <SectionHeader id="listen-title" eyebrow="Listen" title={playlist.title} intro="A soundtrack for train windows, ghat mornings and late-night chai." />
          <SpotifyEmbed id={playlist.spotifyPlaylistId} title={playlist.title} searchQuery={playlist.searchQuery} />
          <aside className="mt-8 flex gap-4 rounded-2xl border border-border bg-bg-alt p-6 md:p-8">
            <IconBadge icon={Music2} size={44} />
            <div>
              <h2 className="text-xl font-semibold">The city&apos;s musical mood</h2>
              <p className="mt-2 text-[15px] leading-relaxed">
                Kanpur&apos;s soundtrack once began with mill sirens calling the morning shift. In the old city, mehfils
                kept thumri and ghazal alive in courtyards after dark, and every monsoon still brings Kajri — the
                rain songs of eastern Uttar Pradesh — drifting out of homes and village fairs. Today the beat is just as
                likely to come from a hostel window at IIT or a coaching-town café, where students stream lo-fi between
                lectures. This playlist tries to hold all of it at once.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
