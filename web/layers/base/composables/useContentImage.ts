import { useMainStore } from "~/stores/mainStore";

// Shared content image helper.
// Returns the item's image with a per-`_type` fallback (uses the Pinia
// `useMainStore()` site fallbacks). Mirrors the inlined `useImageManagement()`
// copies that prefer `image` then `mainImage`, then fall back per `_type`,
// defaulting to the person fallback.
// NOTE: only the components whose inlined copy was byte-for-byte equivalent in
// logic adopt this (ModuleContentGrid, ModuleContentTeaser). Components with a
// divergent fallback chain keep their local copy on purpose.
// biome-ignore lint/suspicious/noExplicitAny: items are loosely typed Sanity docs
type ImageItem = any;

/**
 * Sanity serves the untouched original from `asset.url`. For a 1254x1254 PNG
 * that is ~2.9 MB, while the same image resized to 750px and negotiated as
 * WebP is ~27 KB. Always route <img> src values through this helper.
 */
export const sanityImageUrl = (
	url: string | undefined,
	width = 750,
): string | undefined => {
	if (!url) return undefined;
	// Leave non-Sanity URLs (SoundCloud artwork, placeholders) untouched.
	if (!url.startsWith("https://cdn.sanity.io/")) return url;
	if (url.includes("?")) return url;
	return `${url}?w=${width}&fit=max&auto=format`;
};

export const useContentImage = () => {
	const mainStore = useMainStore();

	// Helper function for image fetching and fallbacks
	function getItemImage(item: ImageItem) {
		if (item.image) return item.image;
		if (item.mainImage) return item.mainImage;

		const fallbacks = mainStore.siteFallbacks;
		switch (item._type) {
			case "person":
				return fallbacks?.fallbackPerson?.image;
			case "venue":
				return fallbacks?.fallbackVenue?.image;
			case "show":
				return fallbacks?.fallbackShow?.image;
			case "set":
				return fallbacks?.fallbackSet?.image;
			case "word":
			case "article":
				return fallbacks?.fallbackArticle?.image;
			default:
				return fallbacks?.fallbackPerson?.image;
		}
	}

	// Non-blocking image existence check (matches the inlined `checkImage`
	// helpers); kept for parity with the original `useImageManagement` API.
	function checkImageExists(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = url;
		});
	}

	return {
		getItemImage,
		checkImageExists,
	};
};
