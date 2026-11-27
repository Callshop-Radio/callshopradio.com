import { defineStore } from "pinia";
import { ref } from "vue";
import type { SetPlayable } from "~~/layers/base/utils/setPlayable";
import type {
	PlayerFeed,
	PlayerSchedule,
	PlayerWaveform,
} from "~~/types/player";

export const usePlayerStore = defineStore("player", () => {
	const mode = ref<"stream" | "set">("stream");
	const feed = ref<PlayerFeed | null>(null);
	const set = ref<SetPlayable | null>(null);
	const schedule = ref<PlayerSchedule | null>(null);
	const waveform = ref<PlayerWaveform | null>(null);
	const playing = ref(false);
	const loading = ref(false);
	const progress = ref<{ positionMs: number; durationMs: number } | null>(null);
	const error = ref<string | null>(null);
	const stale = ref(false);
	const streamWasPlaying = ref(false);
	/**
	 * What the listener asked for, independent of what the engine is doing.
	 * A paused player stays paused: no automatic resume after a set, a stream
	 * error or a show change.
	 */
	const intent = ref<"playing" | "paused">("paused");

	function setFeed(next: PlayerFeed) {
		feed.value = next;
	}

	function setSchedule(next: PlayerSchedule | null) {
		schedule.value = next;
	}

	function openSet(next: SetPlayable) {
		if (mode.value === "stream") streamWasPlaying.value = playing.value;
		set.value = next;
		mode.value = "set";
		waveform.value = null;
		playing.value = false;
		loading.value = false;
		progress.value = null;
		error.value = null;
	}

	function closeSet() {
		set.value = null;
		mode.value = "stream";
		waveform.value = null;
		playing.value = false;
		loading.value = false;
		progress.value = null;
		error.value = null;
	}

	function setPlaying(value: boolean) {
		playing.value = value;
	}

	function setIntent(value: "playing" | "paused") {
		intent.value = value;
	}

	function setWaveform(value: PlayerWaveform | null) {
		waveform.value = value;
	}

	function setLoading(value: boolean) {
		loading.value = value;
	}

	function setProgress(
		value: { positionMs: number; durationMs: number } | null,
	) {
		progress.value = value;
	}

	function setError(message: string | null) {
		error.value = message;
	}

	function clearError() {
		error.value = null;
	}

	return {
		mode,
		feed,
		set,
		schedule,
		waveform,
		playing,
		loading,
		progress,
		error,
		stale,
		streamWasPlaying,
		intent,
		setFeed,
		setSchedule,
		openSet,
		closeSet,
		setPlaying,
		setIntent,
		setWaveform,
		setLoading,
		setProgress,
		setError,
		clearError,
	};
});
