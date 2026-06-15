import { useMainStore } from "~/stores/mainStore";

// Shared SoundCloud artwork + playback helper (item-argument form).
// Mirrors the inlined copies in the content grid / teaser / search components
// exactly: artwork URL rewrite (`-large` -> `-t500x500`) with a parentShow ->
// store-fallback chain, and `playTrack` writing the track to the Pinia store.
// biome-ignore lint/suspicious/noExplicitAny: items are loosely typed Sanity docs
type ArtworkItem = any;

export const useSoundcloudArtwork = () => {
	const mainStore = useMainStore();

	// Non-blocking artwork URL resolution - returns URL directly, browser handles 404s
	function getSoundcloudArtwork(item: ArtworkItem): string {
		const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url as
			| string
			| undefined;
		if (artworkUrl) {
			return artworkUrl.replace("-large", "-t500x500");
		}
		const parentShowImageUrl = item?.parentShow?.image?.asset?.url;
		const storeFallbackUrl =
			mainStore.siteFallbacks?.fallbackSet?.image?.asset?.url;
		return parentShowImageUrl || storeFallbackUrl || "";
	}

	function playTrack(item: ArtworkItem) {
		if (item?.soundcloud?.tracks?.[0]) {
			const track = item.soundcloud.tracks[0] as {
				id?: number;
				permalink_url?: string;
			};
			if (!track.permalink_url && track.id) {
				track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
			}
			mainStore.currentTrack = track;
		}
	}

	return {
		getSoundcloudArtwork,
		playTrack,
	};
};
