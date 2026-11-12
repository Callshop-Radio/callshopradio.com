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
 * the first value; the client keeps it current every 15 s and refreshes
 * immediately when the tab comes back to the foreground.
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

	const refreshNow = () => {
		void refresh();
		void refreshSchedule();
	};

	// Browsers throttle timers in background tabs, so keep polling there too and
	// refresh immediately whenever the tab returns to the foreground. The feed
	// must never stay on a set that has already ended.
	useIntervalFn(refreshNow, 15_000);
	useEventListener(document, "visibilitychange", () => {
		if (document.visibilityState === "visible") refreshNow();
	});
	useEventListener(window, "focus", refreshNow);
	useEventListener(window, "pageshow", refreshNow);
	useEventListener("online", refreshNow);
	onMounted(() => {
		refreshNow();
	});

	await asyncData;
	if (data.value) store.setFeed(data.value);

	return { feed: data, refresh };
}
