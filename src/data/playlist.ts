/**
 * City Playlist (Spotify). To swap playlists, paste the ID from
 * https://open.spotify.com/playlist/<ID> into `spotifyPlaylistId`.
 */
export const playlist = {
  spotifyPlaylistId: "2XIOA4xQMHylwlaJYiddId",
  title: "The Sound of Kanpur",
  searchQuery: "Kanpur Lucknow Awadh thumri kajri indie",
};

export const playlistUrl = `https://open.spotify.com/playlist/${playlist.spotifyPlaylistId}`;

export function isRealSpotifyId(id: string) {
  return /^[A-Za-z0-9]{22}$/.test(id);
}
