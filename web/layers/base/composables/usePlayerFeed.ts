import { onMounted, watch } from "vue";
import type { PlayerFeed } from "~~/types/player";

interface StreamStatusPayload {
	stream1?: {
		liveData?: {
			shows?: {
				current?: {
					name?: unknown;
					starts?: unknown;
					ends?: unknown;
				} | null;
			};
		} | null;
	} | null;
}

/**
 * One shared feed for the header row and the video panel. The server renders
 * the first value; the client refreshes every 20 s while the tab is visible.
 */
export async function usePlayerFeed() {
	const config = useRuntimeConfig();
	const store = usePlayerStore();

	async function refreshSchedule() {
		try {
			const status = await $fetch<StreamStatusPayload>("/api/stream/status");
			const current = status?.stream1?.liveData?.shows?.current;
			const name = typeof current?.name === "string" ? current.name.trim() : "";
			const starts = typeof current?.starts === "string" ? current.starts : "";
			const ends = typeof current?.ends === "string" ? current.ends : "";
			store.setSchedule(name && starts && ends ? { name, starts, ends } : null);
		} catch {
			store.setSchedule(null);
		}
	}

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
	useIntervalFn(() => {
		if (visible.value === "visible") {
			void refresh();
			void refreshSchedule();
		}
	}, 20_000);
	watch(visible, (value) => {
		if (value === "visible") {
			void refresh();
			void refreshSchedule();
		}
	});
	useEventListener("online", () => {
		void refresh();
		void refreshSchedule();
	});
	onMounted(() => {
		void refreshSchedule();
	});

	await asyncData;
	if (data.value) store.setFeed(data.value);

	return { feed: data, refresh };
}
