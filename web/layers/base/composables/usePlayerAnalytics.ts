import { watch } from "vue";
import { usePlayerStore } from "~/stores/playerStore";
import { nextMilestones } from "~/layers/base/utils/player";

export function usePlayerAnalytics() {
	const store = usePlayerStore();
	const { track, trackUmami } = useAnalytics();
	let pingTimer: ReturnType<typeof setInterval> | null = null;
	let trackedSetId: string | null = null;
	const seen = new Set<number>();
	const stopWatchers: Array<() => void> = [];

	function context() {
		if (store.mode === "set" && store.set) {
			return {
				content_type: "set",
				set_id: store.set.id,
				set_title: store.set.title,
				show_id: store.set.show?.id,
				show_title: store.set.show?.title,
			};
		}
		return {
			content_type: "live",
			stream: "channelOne",
			now_playing: store.feed?.title,
			show_title: store.feed?.show?.title,
		};
	}

	function stopPing() {
		if (pingTimer) {
			clearInterval(pingTimer);
			pingTimer = null;
		}
	}

	function startPing() {
		stopPing();
		pingTimer = setInterval(() => {
			if (!store.playing) return;
			trackUmami("listen-ping", { ...context(), minutes: 1 });
		}, 60_000);
	}

	function start() {
		stopWatchers.push(
			watch(
				[() => store.set, () => store.playing],
				([set, playing]) => {
					if (!set || !playing || trackedSetId === set.id) return;
					trackedSetId = set.id;
					seen.clear();
					track("play_set", context());
				},
				{ immediate: true },
			),
			watch(
				() => store.playing,
				(playing) => {
					if (playing) startPing();
					else stopPing();
				},
				{ immediate: true },
			),
			watch(
				() => store.progress,
				(progress) => {
					if (!progress || store.mode !== "set") return;
					const percent =
						progress.durationMs > 0
							? (progress.positionMs / progress.durationMs) * 100
							: 0;
					for (const milestone of nextMilestones(percent, seen)) {
						seen.add(milestone);
						track("audio_progress", { ...context(), percent: milestone });
					}
				},
				{ deep: true },
			),
			watch(
				() => store.error,
				(error) => {
					if (!error) return;
					track("audio_error", {
						...context(),
						source: store.mode === "set" ? "soundcloud" : "stream",
					});
				},
			),
		);
	}

	function stop() {
		stopPing();
		for (const unwatch of stopWatchers.splice(0)) unwatch();
	}

	return { start, stop };
}
