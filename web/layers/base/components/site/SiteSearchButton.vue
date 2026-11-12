<script setup>
import { useSearch } from "~/composables/useSearch";

const isOpen = ref(false);
const advancedOpen = ref(false);
const advancedQuery = ref("");
const inputRef = ref(null);
const wrapperRef = ref(null);

const {
	searchQuery: query,
	results: suggestions,
	isLoading: suggestionsLoading,
	hasQuery: hasSuggestionQuery,
	getResultPath,
	getTypeLabel,
	getTypeColor,
	clearSearch,
} = useSearch({ maxResults: 50, debounceMs: 150 });

const activeIndex = ref(-1);
const showSuggestions = computed(
	() => isOpen.value && query.value.trim().length > 0,
);

function openSearch() {
	isOpen.value = true;
	nextTick(() => inputRef.value?.focus());
}

function closeSearch() {
	isOpen.value = false;
	activeIndex.value = -1;
}

function toggleSearch() {
	if (isOpen.value) closeSearch();
	else openSearch();
}

function selectSuggestion(result) {
	const path = getResultPath(result);
	closeSearch();
	clearSearch();
	if (path) navigateTo(path);
}

function openAdvanced() {
	advancedQuery.value = query.value.trim();
	isOpen.value = false;
	activeIndex.value = -1;
	advancedOpen.value = true;
}

function handleInputKeydown(event) {
	if (event.key === "ArrowDown") {
		event.preventDefault();
		if (suggestions.value.length) {
			activeIndex.value = Math.min(
				activeIndex.value + 1,
				suggestions.value.length - 1,
			);
		}
		return;
	}
	if (event.key === "ArrowUp") {
		event.preventDefault();
		activeIndex.value = Math.max(activeIndex.value - 1, -1);
		return;
	}
	if (event.key === "Enter") {
		event.preventDefault();
		const active = suggestions.value[activeIndex.value];
		if (activeIndex.value >= 0 && active) {
			selectSuggestion(active);
			return;
		}
		openAdvanced();
		return;
	}
	if (event.key === "Escape") {
		event.preventDefault();
		closeSearch();
	}
}

const handleKeydown = (event) => {
	if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
		event.preventDefault();
		openSearch();
		return;
	}
	if (event.key === "Escape" && isOpen.value) {
		event.preventDefault();
		closeSearch();
	}
};

const handlePointerDown = (event) => {
	if (!isOpen.value) return;
	if (wrapperRef.value?.contains(event.target)) return;
	closeSearch();
};

watch(suggestions, () => {
	activeIndex.value = -1;
});

onMounted(() => {
	document.addEventListener("keydown", handleKeydown);
	document.addEventListener("pointerdown", handlePointerDown);
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeydown);
	document.removeEventListener("pointerdown", handlePointerDown);
});
</script>

<template>
	<div
		ref="wrapperRef"
		class="site-search-button-wrapper"
		:class="{ 'is-open': isOpen }"
	>
		<div
			class="search-pill"
			:class="{
				'is-open': isOpen,
			}"
		>
			<button
				v-if="!isOpen"
				type="button"
				class="search-toggle"
				aria-label="Search"
				@click="toggleSearch"
			>
				<svg
					class="search-icon"
					width="10"
					height="10"
					viewBox="0 0 10 10"
					fill="none"
					aria-hidden="true"
				>
					<circle
						cx="5.33765"
						cy="4.59622"
						r="2.75002"
						transform="rotate(45 5.33765 4.59622)"
					/>
					<path
						d="M0.159881 8.71358C-0.0425288 8.90142 -0.0543383 9.21779 0.133504 9.4202C0.321346 9.62261 0.637709 9.63442 0.840119 9.44657L0.159881 8.71358ZM3.08151 7.3665L3.44801 7.02638L2.76777 6.29339L2.40128 6.6335L3.08151 7.3665ZM0.840119 9.44657L3.08151 7.3665L2.40128 6.6335L0.159881 8.71358L0.840119 9.44657Z"
					/>
				</svg>
				<span class="button-text">Search</span>
			</button>

			<template v-else>
				<svg
					class="search-icon"
					width="10"
					height="10"
					viewBox="0 0 10 10"
					fill="none"
					aria-hidden="true"
				>
					<circle
						cx="5.33765"
						cy="4.59622"
						r="2.75002"
						transform="rotate(45 5.33765 4.59622)"
					/>
					<path
						d="M0.159881 8.71358C-0.0425288 8.90142 -0.0543383 9.21779 0.133504 9.4202C0.321346 9.62261 0.637709 9.63442 0.840119 9.44657L0.159881 8.71358ZM3.08151 7.3665L3.44801 7.02638L2.76777 6.29339L2.40128 6.6335L3.08151 7.3665ZM0.840119 9.44657L3.08151 7.3665L2.40128 6.6335L0.159881 8.71358L0.840119 9.44657Z"
					/>
				</svg>

				<input
					ref="inputRef"
					v-model="query"
					type="search"
					class="search-input"
					placeholder="Search…"
					autocomplete="off"
					aria-label="Search shows, sets, people and words"
					:aria-expanded="showSuggestions"
					@keydown="handleInputKeydown"
				>

				<button
					type="button"
					class="icon-button advanced-button"
					aria-label="Advanced archive search"
					title="Advanced search"
					@click="openAdvanced"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M1 3.5h5M9.5 3.5H13M1 10.5h3.5M8 10.5h5"
							stroke="currentColor"
							stroke-width="1.2"
							stroke-linecap="round"
						/>
						<circle
							cx="7.75"
							cy="3.5"
							r="1.6"
							stroke="currentColor"
							stroke-width="1.2"
						/>
						<circle
							cx="6.25"
							cy="10.5"
							r="1.6"
							stroke="currentColor"
							stroke-width="1.2"
						/>
					</svg>
				</button>

				<button
					type="button"
					class="icon-button close-button"
					aria-label="Close search"
					@click="closeSearch"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M2 2l8 8M10 2l-8 8"
							stroke="currentColor"
							stroke-width="1.2"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</template>
		</div>

		<Transition name="suggestions">
			<div v-if="showSuggestions" class="search-suggestions">
				<div v-if="suggestionsLoading" class="search-suggestions__empty">
					Searching…
				</div>

				<button
					v-for="(result, index) in suggestions"
					:key="result._id"
					type="button"
					class="search-suggestions__item"
					:class="[getTypeColor(result._type), { 'is-active': index === activeIndex }]"
					@mouseenter="activeIndex = index"
					@click="selectSuggestion(result)"
				>
					<span class="search-suggestions__title">{{ result.title }}</span>
					<span
						class="search-suggestions__type"
						:class="getTypeColor(result._type)"
					>
						{{ getTypeLabel(result._type) }}
					</span>
				</button>

				<div
					v-if="!suggestionsLoading && !suggestions.length"
					class="search-suggestions__empty"
				>
					No matches. Press Enter for the advanced search.
				</div>

				<button
					v-if="hasSuggestionQuery"
					type="button"
					class="search-suggestions__more"
					@click="openAdvanced"
				>
					<span>Advanced search for “{{ query.trim() }}”</span>
					<span aria-hidden="true">↵</span>
				</button>
			</div>
		</Transition>

		<SiteSearchAdvanced v-model="advancedOpen" :initial-query="advancedQuery" />
	</div>
</template>

<style lang="postcss" scoped>
.site-search-button-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 6.5rem;
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
  padding: 0 calc(var(--small-padding)) 0 var(--base-padding);
  box-sizing: border-box;
  overflow: hidden;
  border: 0.09325rem solid var(--color-text);
  border-radius: var(--pill-radius);
  background-color: var(--color-bg);
  color: var(--color-text);
  transition:
    width var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);

  &:not(.is-open):hover {
    border-color: var(--color-text);
    background-color: var(--color-text);
    color: var(--color-bg);
  }

  &.is-open {
    width: 20rem;
    padding-right: 0.25rem;
  }

  .search-icon {
    flex: none;
    color: inherit;

    circle {
      stroke: currentColor;
      fill: none;
    }

    path {
      fill: currentColor;
    }
  }
}

.search-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: var(--font-text-semibold);
  font-size: var(--small-font-size);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
  cursor: pointer;
}

.search-input {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: var(--font-text-semibold);
  font-size: var(--small-font-size);
  outline: none;

  &::placeholder {
    color: var(--color-text-light, var(--color-dark-grey));
    text-transform: none;
    letter-spacing: normal;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 1.375rem;
  height: 1.375rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    background-color: var(--color-text);
    color: var(--color-bg);
  }
}

.search-suggestions {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 999998;
  width: 24rem;
  max-height: min(70vh, 30rem);
  overflow-y: auto;
  padding: 0.375rem;
  background: var(--color-bg);
  border: 1px solid var(--color-text);
  border-radius: var(--pill-radius);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  scrollbar-width: thin;

  &__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.45rem 0.6rem;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    font-family: var(--font-text-semibold);
    font-size: var(--small-font-size);
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);

    &:hover,
    &.is-active {
      background: color-mix(in srgb, var(--color-text) 8%, transparent);
    }

    &.type-shows:hover,
    &.type-shows.is-active {
      border-color: var(--color-pink);
    }

    &.type-pool:hover,
    &.type-pool.is-active {
      border-color: var(--color-blue);
    }

    &.type-words:hover,
    &.type-words.is-active {
      border-color: var(--color-green);
    }

    &.type-tag:hover,
    &.type-tag.is-active {
      border-color: var(--color-text);
    }
  }

  &__title {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type {
    flex: none;
    padding: 0.05rem 0.4rem;
    border: 1px solid currentColor;
    border-radius: var(--pill-radius);
    font-size: var(--mini-font-size);
    letter-spacing: var(--button-letter-spacing);
    text-transform: uppercase;
    color: var(--color-text-light, var(--color-dark-grey));

    &.type-shows {
      color: var(--color-pink);
    }

    &.type-pool {
      color: var(--color-blue);
    }

    &.type-words {
      color: var(--color-green);
    }

    &.type-tag {
      color: var(--color-text);
    }
  }

  &__empty {
    padding: 0.75rem 0.6rem;
    font-family: var(--font-text);
    font-size: var(--small-font-size);
    color: var(--color-text-light, var(--color-dark-grey));
  }

  &__more {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    width: 100%;
    margin-top: 0.25rem;
    padding: 0.55rem 0.6rem;
    border: 0;
    border-top: 1px solid var(--color-grey);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-text-semibold);
    font-size: var(--small-font-size);
    text-align: left;
    cursor: pointer;

    &:hover {
      background: color-mix(in srgb, var(--color-text) 8%, transparent);
    }
  }
}

.suggestions-enter-active,
.suggestions-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.suggestions-enter-from,
.suggestions-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

@media (max-width: 1100px) and (min-width: 901px) {
  .search-pill.is-open {
    width: 18rem;
  }
}

@media (max-width: 900px) {
  /* The open pill becomes a fixed bar below the nav; keep its slot in the
     header so the icon group does not jump sideways. */
  .site-search-button-wrapper.is-open {
    flex: none;
    width: calc(var(--base-font-size) + var(--small-padding) * 2);
  }

  .search-pill {
    justify-content: center;
    width: calc(var(--base-font-size) + var(--small-padding) * 2);
    padding: 0;
    border-radius: 50%;

    &:not(.is-open) .button-text {
      display: none;
    }

    &.is-open {
      position: fixed;
      top: var(--nav-bar-height);
      right: 0;
      left: 0;
      z-index: 999998;
      width: auto;
      height: 2.75rem;
      padding: 0 var(--base-padding);
      border-right: 0;
      border-left: 0;
      border-radius: 0;
    }
  }

  .search-suggestions {
    position: fixed;
    top: calc(var(--nav-bar-height) + 2.75rem + 0.25rem);
    right: var(--base-padding);
    left: var(--base-padding);
    width: auto;
    max-height: calc(
      100svh - var(--nav-bar-height) - var(--player-bar-height) - 5rem
    );
  }

  .search-toggle {
    justify-content: center;
  }
}
</style>
