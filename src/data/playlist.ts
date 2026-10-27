/**
 * City Playlist (Spotify).
 * ⚠️ PLACEHOLDER — replace `spotifyPlaylistId` with your playlist's ID
 * (from https://open.spotify.com/playlist/<ID>). Until a real ID is set,
 * the page shows a styled card linking to Spotify search instead of an embed.
 */
export const playlist = {
  spotifyPlaylistId: "REPLACE_ME",
  title: "The Sound of Kanpur",
  searchQuery: "Kanpur Lucknow Awadh thumri kajri indie",
};

export function isRealSpotifyId(id: string) {
  return /^[A-Za-z0-9]{22}$/.test(id);
}
