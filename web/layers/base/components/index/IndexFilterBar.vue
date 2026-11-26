<script setup lang="ts">
import type { SortMode } from "~/data/label-index/types";

const props = defineProps<{
	query: string;
	sort: SortMode;
	visible: number;
	total: number;
}>();

const emit = defineEmits<{
	"update:query": [value: string];
	"update:sort": [value: SortMode];
}>();

function onInput(event: Event) {
	emit("update:query", (event.target as HTMLInputElement).value);
}

function setSort(value: SortMode) {
	emit("update:sort", value);
}
</script>

<template>
	<div class="index-filter">
		<label class="index-filter__search">
			<span class="sr-only">Search labels</span>
			<svg
				class="index-filter__icon"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<circle
					cx="10.5"
					cy="10.5"
					r="6.5"
					stroke="currentColor"
					stroke-width="1.8"
				/>
				<path
					d="m15.4 15.4 4.2 4.2"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>
			<input
				type="search"
				:value="query"
				placeholder="Search labels"
				autocomplete="off"
				@input="onInput"
			/>
		</label>

		<div class="index-filter__sort" role="group" aria-label="Sort labels">
			<button
				type="button"
				:aria-pressed="sort === 'az'"
				@click="setSort('az')"
			>
				A–Z
			</button>
			<button
				type="button"
				:aria-pressed="sort === 'year'"
				@click="setSort('year')"
			>
				Year
			</button>
			<button
				type="button"
				:aria-pressed="sort === 'shuffle'"
				@click="setSort('shuffle')"
			>
				Shuffle
			</button>
		</div>

		<p class="index-filter__count" aria-live="polite">
			{{ visible }} / {{ total }}
		</p>
	</div>
</template>

<style lang="postcss" scoped>
.index-filter {
  position: sticky;
  /* Under the fixed navigation and player strip. */
  top: calc(var(--nav-bar-height) + var(--player-bar-height));
  z-index: 40;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-text) 16%, transparent);
  background-color: var(--color-bg);
}

.index-filter__search {
  position: relative;
  display: flex;
  flex: 1 1 16rem;
  align-items: center;
  max-width: 24rem;

  input {
    width: 100%;
    height: 2.25rem;
    padding: 0 0.9rem 0 2.3rem;
    border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text);
    font: inherit;
    font-size: var(--text-md);

    &::placeholder {
      color: var(--color-dark-grey);
      text-transform: uppercase;
      letter-spacing: var(--button-letter-spacing);
    }

    &:focus-visible {
      border-color: var(--accent, var(--color-purple));
      outline: 2px solid var(--accent, var(--color-purple));
      outline-offset: 2px;
    }
  }
}

.index-filter__icon {
  position: absolute;
  left: 0.85rem;
  color: var(--color-text);
  pointer-events: none;
}

.index-filter__sort {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;

  button {
    padding: 0.32rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
    border-radius: var(--radius-circle);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-text-medium);
    font-size: var(--text-sm);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);

    &:hover {
      border-color: var(--accent, var(--color-purple));
      color: var(--accent, var(--color-purple));
    }

    &[aria-pressed="true"] {
      border-color: var(--accent, var(--color-purple));
      background-color: var(--accent, var(--color-purple));
      color: var(--color-bg);
    }

    &:focus-visible {
      outline: 2px solid var(--accent, var(--color-purple));
      outline-offset: 2px;
    }
  }
}

.index-filter__count {
  margin: 0 0 0 auto;
  color: var(--accent, var(--color-purple));
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

@media screen and (max-width: 700px) {
  .index-filter {
    align-items: stretch;
  }

  .index-filter__search {
    max-width: none;
    flex-basis: 100%;
  }

  .index-filter__count {
    align-self: center;
  }
}
</style>
