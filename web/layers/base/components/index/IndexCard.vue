<script setup lang="ts">
import type { Label } from "~/data/label-index/types";

defineProps<{ label: Label }>();

const emit = defineEmits<{
	open: [label: Label, event: MouseEvent];
}>();
</script>

<template>
	<button
		type="button"
		class="index-card"
		@click="emit('open', label, $event)"
	>
		<span class="index-card__logo">
			<img
				:src="label.logo"
				alt=""
				:width="label.logoWidth"
				:height="label.logoHeight"
				loading="lazy"
				decoding="async"
			/>
		</span>
		<span class="index-card__caption">
			<span class="index-card__name">{{ label.name }}</span>
			<span v-if="label.founded" class="index-card__year">
				({{ label.founded }})
			</span>
		</span>
	</button>
</template>

<style lang="postcss" scoped>
.index-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
  border-radius: var(--radius-media);
  background-color: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    border-color: var(--index-accent, var(--color-purple));
    box-shadow: 0 0.8rem 2rem
      color-mix(in srgb, var(--index-accent, var(--color-purple)) 18%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--index-accent, var(--color-purple));
    outline-offset: 3px;
  }

  &__logo {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    padding: 12%;
    background-color: #fff;
    border-bottom: 1px solid
      color-mix(in srgb, var(--color-text) 10%, transparent);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__caption {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 0.3rem;
    padding: 0.65rem 0.5rem 0.7rem;
    font-size: var(--small-font-size);
    line-height: 1.25;
  }

  &__name {
    font-family: var(--font-text-medium);
  }

  &__year {
    color: var(--color-dark-grey);
  }
}

@media (prefers-reduced-motion: reduce) {
  .index-card {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
