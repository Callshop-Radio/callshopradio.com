<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";

const props = withDefaults(
	defineProps<{
		modelValue: number;
		options?: number[];
	}>(),
	{
		options: () => [3, 4, 5, 6],
	},
);

const emit = defineEmits<{
	"update:modelValue": [value: number];
}>();

const isStretching = ref(false);
let stretchTimer: ReturnType<typeof setTimeout> | null = null;

const activeIndex = computed(() => {
	const index = props.options.indexOf(props.modelValue);
	return index >= 0 ? index : 0;
});

function startStretch(event?: Event) {
	if (
		event instanceof PointerEvent &&
		event.pointerType === "mouse" &&
		event.button !== 0
	)
		return;
	if (stretchTimer) clearTimeout(stretchTimer);
	isStretching.value = true;
}

function stopStretch(delay = 0) {
	if (stretchTimer) clearTimeout(stretchTimer);
	stretchTimer = setTimeout(() => {
		isStretching.value = false;
	}, delay);
}

function selectColumns(columns: number) {
	emit("update:modelValue", columns);
}

onUnmounted(() => {
	if (stretchTimer) clearTimeout(stretchTimer);
});
</script>

<template>
	<div class="grid-density" role="group" aria-label="Grid columns">
		<span class="grid-density__label">Cols</span>
		<div
			class="grid-density__control"
			:class="{ 'is-stretching': isStretching }"
			@pointerdown="startStretch"
			@pointerup="stopStretch(120)"
			@pointercancel="stopStretch()"
			@pointerleave="stopStretch()"
			@keydown.space="startStretch"
			@keydown.enter="startStretch"
			@keyup.space="stopStretch(120)"
			@keyup.enter="stopStretch(120)"
		>
			<span
				class="grid-density__thumb"
				:style="`--grid-index: ${activeIndex}`"
			/>
			<button
				v-for="columns in props.options"
				:key="columns"
				type="button"
				class="grid-density__option"
				:class="{ 'is-active': props.modelValue === columns }"
				:aria-label="`${columns} columns`"
				:aria-pressed="props.modelValue === columns"
				@click="selectColumns(columns)"
			>
				{{ columns }}
			</button>
		</div>
	</div>
</template>

<style scoped>
.grid-density {
	display: inline-flex;
	align-items: center;
	gap: var(--small-padding);
	margin: 0 auto;
	color: var(--color-text);
	user-select: none;
}

.grid-density__label {
	font-size: var(--small-font-size);
	font-family: var(--font-text-semibold);
	text-transform: uppercase;
	color: var(--color-text);
	pointer-events: none;
}

.grid-density__control {
	--density-step: 1.55rem;

	position: relative;
	display: grid;
	grid-template-columns: repeat(4, var(--density-step));
	align-items: center;
	padding: 3px;
	border-radius: 100px;
	background-color: rgba(128, 128, 128, 0.18);
	background-color: color-mix(in srgb, var(--color-text) 14%, transparent);
	touch-action: manipulation;
}

.grid-density__option {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 1.55rem;
	padding: 0;
	border: 0;
	border-radius: 100px;
	background: transparent;
	color: var(--color-text);
	font-family: var(--font-text-semibold);
	font-size: 0.625rem;
	line-height: 1;
	font-variant-numeric: tabular-nums;
	text-align: center;
	cursor: pointer;
	transition: color var(--transition-fast);
}

.grid-density__option:not(.is-active):hover {
	color: var(--theme-color);
}

.grid-density__option:focus-visible {
	outline: 2px solid var(--theme-color);
	outline-offset: 2px;
}

.grid-density__option.is-active {
	color: var(--color-bg);
}

.grid-density__thumb {
	position: absolute;
	top: 3px;
	bottom: 3px;
	left: calc(3px + var(--grid-index, 0) * var(--density-step));
	width: var(--density-step);
	border-radius: 100px;
	background-color: var(--color-text);
	transition:
		left 0.38s cubic-bezier(0.22, 1, 0.36, 1),
		width 0.2s ease-out;
	pointer-events: none;
	will-change: left, width;
}

.grid-density__control.is-stretching .grid-density__thumb {
	left: calc(
		3px + var(--grid-index, 0) * var(--density-step) -
			var(--density-step) * 0.09
	);
	width: calc(var(--density-step) * 1.18);
}

@media (max-width: 1100px) {
	.grid-density {
		display: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.grid-density__thumb {
		transition: none;
	}
}
</style>
