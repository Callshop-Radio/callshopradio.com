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

export const useContentImage = () => {
	const mainStore = useMainStore();

	// Helper-Funktion für Bild-Fetching und Fallbacks
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
