import { watch } from "vue";
import type { PlayerFeed } from "~~/types/player";

/**
 * One shared feed for the header row and the video panel. The server renders
 * the first value; the client refreshes every 20 s while the tab is visible.
 */
export async function usePlayerFeed() {
	const config = useRuntimeConfig();
	const store = usePlayerStore();

	const fallbackFeed = (): PlayerFeed => ({
		version: 1,
		updatedAt: new Date().toISOString(),
		state: "unknown",
		audio: {
			url: String(config.public.streamUrl),
			fallbackUrl: String(config.public.streamFallbackUrl),
		},
		video: null,
		title: "Callshop Radio",
		subtitle: "Live",
		cover: null,
		show: null,
		set: null,
		artists: [],
		track: null,
		progress: null,
		tracklist: null,
		source: "fallback",
	});

	const asyncData = useAsyncData<PlayerFeed>(
		"player-feed",
		() => $fetch("/api/player/now"),
		{ server: true, lazy: false, default: fallbackFeed },
	);
	const { data, refresh } = asyncData;

	watch(
		data,
		(value) => {
			if (value) store.setFeed(value);
		},
		{ immediate: true },
	);

	const visible = useDocumentVisibility();
	useIntervalFn(
		() => {
			if (visible.value === "visible") void refresh();
		},
		20_000,
		{ immediate: false },
	);
	useEventListener("online", () => {
		void refresh();
	});

	await asyncData;
	if (data.value) store.setFeed(data.value);

	return { feed: data, refresh };
}
