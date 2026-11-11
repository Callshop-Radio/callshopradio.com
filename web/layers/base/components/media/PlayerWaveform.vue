<script setup lang="ts">
import { computed, ref } from "vue";
import { waveformPath } from "~~/layers/base/utils/waveform";

const props = defineProps<{
	samples: number[];
	height?: number;
	progress: number;
	positionMs: number;
	durationMs: number;
}>();

const emit = defineEmits<{ seek: [ratio: number] }>();

const bars = 240;
const clipId = "player-waveform-clip";
const dragging = ref(false);

const path = computed(() =>
	waveformPath(props.samples, props.height ?? 140, bars),
);
const percent = computed(() =>
	Math.min(100, Math.max(0, Number(props.progress) * 100)),
);

function ratioFromEvent(event: PointerEvent): number {
	const target = event.currentTarget as HTMLElement | null;
	if (!target) return 0;
	const rect = target.getBoundingClientRect();
	if (rect.width <= 0) return 0;
	return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
}

function onPointerDown(event: PointerEvent) {
	if (!props.durationMs) return;
	dragging.value = true;
	(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
	emit("seek", ratioFromEvent(event));
}

function onPointerMove(event: PointerEvent) {
	if (!dragging.value) return;
	emit("seek", ratioFromEvent(event));
}

function onPointerUp(event: PointerEvent) {
	if (!dragging.value) return;
	dragging.value = false;
	(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
}

function onKeydown(event: KeyboardEvent) {
	if (!props.durationMs) return;
	if (event.key === "Home") {
		event.preventDefault();
		emit("seek", 0);
		return;
	}
	if (event.key === "End") {
		event.preventDefault();
		emit("seek", 1);
		return;
	}
	if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
	event.preventDefault();
	const step = 5_000 / props.durationMs;
	emit(
		"seek",
		Math.min(
			1,
			Math.max(0, props.progress + (event.key === "ArrowRight" ? step : -step)),
		),
	);
}
</script>

<template>
	<div
		class="player-waveform"
		role="slider"
		tabindex="0"
		aria-label="Im Set springen"
		:aria-valuemin="0"
		:aria-valuemax="Math.round(durationMs / 1000)"
		:aria-valuenow="Math.round(positionMs / 1000)"
		:aria-valuetext="`${Math.round(positionMs / 1000)} Sekunden`"
		@pointerdown="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointercancel="onPointerUp"
		@keydown="onKeydown"
	>
		<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
			<defs>
				<clipPath :id="clipId">
					<rect x="0" y="0" :width="percent * 10" height="100" />
				</clipPath>
			</defs>
			<path class="player-waveform__base" :d="path" />
			<path
				class="player-waveform__played"
				:d="path"
				:clip-path="`url(#${clipId})`"
			/>
		</svg>
	</div>
</template>

<style lang="postcss" scoped>
.player-waveform {
	height: 14px;
	cursor: pointer;
	touch-action: none;

	&:focus-visible {
		outline: 2px solid var(--color-pink);
		outline-offset: 2px;
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	&__base {
		fill: var(--color-text);
		opacity: 0.26;
	}

	&__played {
		fill: var(--color-pink);
	}

	@media screen and (max-width: 900px) {
		height: 12px;
	}
}
</style>
