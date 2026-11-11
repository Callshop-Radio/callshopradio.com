import { defineStore } from "pinia";
import { ref } from "vue";
import type { SetPlayable } from "~~/layers/base/utils/setPlayable";
import type { PlayerFeed } from "~~/types/player";

export const usePlayerStore = defineStore("player", () => {
	const mode = ref<"stream" | "set">("stream");
	const feed = ref<PlayerFeed | null>(null);
	const set = ref<SetPlayable | null>(null);
	const playing = ref(false);
	const loading = ref(false);
	const progress = ref<{ positionMs: number; durationMs: number } | null>(null);
	const error = ref<string | null>(null);
	const stale = ref(false);
	const streamWasPlaying = ref(false);

	function setFeed(next: PlayerFeed) {
		feed.value = next;
	}

	function openSet(next: SetPlayable) {
		if (mode.value === "stream") streamWasPlaying.value = playing.value;
		set.value = next;
		mode.value = "set";
		playing.value = false;
		loading.value = false;
		progress.value = null;
		error.value = null;
	}

	function closeSet() {
		set.value = null;
		mode.value = "stream";
		playing.value = false;
		loading.value = false;
		progress.value = null;
		error.value = null;
	}

	function setPlaying(value: boolean) {
		playing.value = value;
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
		playing,
		loading,
		progress,
		error,
		stale,
		streamWasPlaying,
		setFeed,
		openSet,
		closeSet,
		setPlaying,
		setLoading,
		setProgress,
		setError,
		clearError,
	};
});
