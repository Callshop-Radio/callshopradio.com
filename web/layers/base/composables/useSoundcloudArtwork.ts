import { useMainStore } from "~/stores/mainStore";
import { usePlayerController } from "~~/layers/base/composables/usePlayerController";

// Shared SoundCloud artwork + playback helper (item-argument form).
// Mirrors the inlined copies in the content grid / teaser / search components
// exactly: artwork URL rewrite (`-large` -> `-t500x500`) with a parentShow ->
// store-fallback chain, and `playTrack` opening the shared player row.
// biome-ignore lint/suspicious/noExplicitAny: items are loosely typed Sanity docs
type ArtworkItem = any;

export const useSoundcloudArtwork = () => {
	const mainStore = useMainStore();
	const controller = usePlayerController();

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
		return sanityImageUrl(parentShowImageUrl || storeFallbackUrl) || "";
	}

	function playTrack(item: ArtworkItem) {
		void controller.playSet(item, getSoundcloudArtwork(item) || null);
	}

	return {
		getSoundcloudArtwork,
		playTrack,
	};
};
