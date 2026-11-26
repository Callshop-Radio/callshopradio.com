<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	activeIndex: number;
	total: number;
	label: string;
}>();

defineEmits<{
	prev: [];
	next: [];
}>();

const pad = (value: number) => String(value).padStart(2, "0");

const indexLabel = computed(
	() => `${pad(props.activeIndex + 1)} — ${pad(props.total)}`,
);

const fill = computed(() => {
	if (props.total <= 1) return 1;
	return Math.max(0.06, props.activeIndex / (props.total - 1));
});
</script>

<template>
	<div class="lab-transport">
		<div class="lab-transport__controls">
			<button
				type="button"
				class="lab-transport__button"
				:aria-label="`Vorheriger ${label}`"
				@click="$emit('prev')"
			>
				<svg viewBox="0 0 22 20" aria-hidden="true">
					<path d="M0 9.85L21.13 19.24V0.45L0 9.85Z" />
				</svg>
			</button>
			<button
				type="button"
				class="lab-transport__button"
				:aria-label="`Nächster ${label}`"
				@click="$emit('next')"
			>
				<svg viewBox="0 0 22 20" aria-hidden="true">
					<path d="M22 9.85L0.87 19.24V0.45L22 9.85Z" />
				</svg>
			</button>
		</div>

		<span class="lab-transport__index">{{ indexLabel }}</span>

		<div class="lab-transport__line" aria-hidden="true">
			<span
				class="lab-transport__fill"
				:style="{ transform: `scaleX(${fill})` }"
			/>
		</div>

		<span class="lab-transport__hint">Drag · ← →</span>
	</div>
</template>

<style lang="postcss" scoped>
.lab-transport {
  display: flex;
  align-items: center;
  gap: var(--mid-padding);
  width: 100%;
  max-width: var(--page-max-width);
  margin-inline: auto;
  padding-top: var(--small-padding);

  &__controls {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  &__button {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--color-text) 18%, transparent);
    border-radius: var(--radius-media);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast),
      opacity var(--transition-fast);

    svg {
      width: 0.65rem;
      height: 0.6rem;
    }

    path {
      fill: currentColor;
    }

    &:hover:not(:disabled) {
      color: var(--accent, var(--color-text));
      border-color: var(--accent, var(--color-text));
    }

    &:focus-visible {
      outline: 2px solid var(--accent, var(--color-text));
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.28;
      cursor: default;
    }
  }

  &__index {
    flex-shrink: 0;
    font-size: var(--text-s);
    font-variant-numeric: tabular-nums;
    letter-spacing: var(--button-letter-spacing);
    color: var(--color-text);
  }

  &__line {
    position: relative;
    flex: 1;
    height: 1px;
    overflow: hidden;
    background-color: color-mix(in srgb, var(--color-text) 16%, transparent);
  }

  &__fill {
    position: absolute;
    inset: 0;
    background-color: var(--accent, var(--color-text));
    transform-origin: left center;
  }

  &__hint {
    flex-shrink: 0;
    font-size: var(--text-s);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    color: var(--color-dark-grey);
  }

  @media screen and (max-width: 900px) {
    gap: var(--small-padding);
    max-width: none;
    padding-inline: var(--page-gutter);

    &__button {
      width: 2.75rem;
      height: 2.75rem;
    }

    &__hint {
      display: none;
    }
  }
}
</style>
