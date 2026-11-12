<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
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

const compact = useMediaQuery("(max-width: 900px)");
const bars = computed(() => (compact.value ? 220 : 480));
const clipId = "player-waveform-clip";
const dragging = ref(false);
const hoverRatio = ref<number | null>(null);

const path = computed(() =>
	waveformPath(props.samples, props.height ?? 140, bars.value),
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
	hoverRatio.value = ratioFromEvent(event);
	(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
	emit("seek", hoverRatio.value);
}

function onPointerMove(event: PointerEvent) {
	const ratio = ratioFromEvent(event);
	if (event.pointerType !== "touch" || dragging.value) {
		hoverRatio.value = ratio;
	}
	if (!dragging.value) return;
	emit("seek", ratio);
}

function onPointerUp(event: PointerEvent) {
	if (!dragging.value) return;
	dragging.value = false;
	(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
	if (event.pointerType === "touch") hoverRatio.value = null;
}

function onPointerLeave() {
	if (!dragging.value) hoverRatio.value = null;
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
		@pointerleave="onPointerLeave"
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
		<span
			v-if="hoverRatio !== null"
			class="player-waveform__playhead"
			:style="{ left: `${hoverRatio * 100}%` }"
			aria-hidden="true"
		/>
	</div>
</template>

<style lang="postcss" scoped>
.player-waveform {
	position: relative;
	height: 28px;
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

	&__playhead {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--color-pink);
		transform: translateX(-50%);
		pointer-events: none;
		box-shadow: 0 0 6px
			color-mix(in srgb, var(--color-pink) 65%, transparent);
	}

	@media screen and (max-width: 900px) {
		height: 16px;

		&__playhead {
			width: 1.5px;
		}
	}
}
</style>
