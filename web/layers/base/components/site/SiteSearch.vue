<script setup>
import { useSearch } from "~/composables/useSearch";

const props = defineProps({
	// Whether this is rendered as a modal overlay (quick search) or inline
	isModal: {
		type: Boolean,
		default: false,
	},
	// Auto-focus input when mounted/opened
	autoFocus: {
		type: Boolean,
		default: true,
	},
});

const emit = defineEmits(["close", "select"]);

const localePath = useLocalePath();

const {
	searchQuery,
	results,
	isLoading,
	hasResults,
	hasQuery,
	getResultPath,
	getTypeLabel,
	getTypeColor,
	clearSearch,
} = useSearch({ maxResults: 20, debounceMs: 150 });

const inputRef = ref(null);
const activeIndex = ref(-1);

// Focus input on mount if autoFocus is true
onMounted(() => {
	if (props.autoFocus && inputRef.value) {
		nextTick(() => {
			inputRef.value?.focus();
		});
	}
});

// Keyboard navigation
const handleKeydown = (event) => {
	switch (event.key) {
		case "ArrowDown":
			event.preventDefault();
			if (hasResults.value) {
				activeIndex.value = Math.min(
					activeIndex.value + 1,
					results.value.length - 1,
				);
			}
			break;
		case "ArrowUp":
			event.preventDefault();
			if (hasResults.value) {
				activeIndex.value = Math.max(activeIndex.value - 1, -1);
			}
			break;
		case "Enter":
			event.preventDefault();
			if (activeIndex.value >= 0 && results.value[activeIndex.value]) {
				navigateToResult(results.value[activeIndex.value]);
			}
			break;
		case "Escape":
			event.preventDefault();
			handleClose();
			break;
	}
};

// Navigate to a search result
const navigateToResult = (result) => {
	const path = getResultPath(result);
	emit("select", result);
	clearSearch();
	activeIndex.value = -1;

	if (props.isModal) {
		emit("close");
	}

	navigateTo(localePath(path));
};

// Handle close
const handleClose = () => {
	clearSearch();
	activeIndex.value = -1;
	emit("close");
};

// Navigate to detailed search page
const goToDetailedSearch = () => {
	const query = searchQuery.value.trim();
	handleClose();
	navigateTo(
		localePath(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`),
	);
};

// Reset active index when results change
watch(results, () => {
	activeIndex.value = -1;
});
</script>

<template>
	<div class="site-search" :class="{ 'is-modal': isModal }">
		<!-- Search Input -->
		<div class="search-input-wrapper">
			<div class="search-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle
						cx="11"
						cy="11"
						r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
			</div>
			<input
				ref="inputRef"
				v-model="searchQuery"
				type="text"
				class="search-input"
				placeholder="Search shows, people, venues, articles..."
				autocomplete="off"
				@keydown="handleKeydown"
			>
			<button
				v-if="hasQuery"
				class="clear-button"
				aria-label="Clear search"
				@click="clearSearch"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 6 6 18" />
					<path d="m6 6 12 12" />
				</svg>
			</button>
			<div v-if="isLoading" class="loading-spinner" />
		</div>

		<!-- Search Results -->
		<div v-if="hasQuery" class="search-results">
			<!-- Detailed Search Link -->
			<button class="detailed-search-link" @click="goToDetailedSearch">
				<span class="link-text">Detailed search for "{{ searchQuery }}"</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M5 12h14" />
					<path d="m12 5 7 7-7 7" />
				</svg>
			</button>

			<div v-if="hasResults" class="results-list">
				<button
					v-for="(result, index) in results"
					:key="result._id"
					class="autocomplete-item"
					:class="{
						'is-selected': index === activeIndex
					}"
					@click="navigateToResult(result)"
					@mouseenter="activeIndex = index"
				>
					<span class="autocomplete-title">{{ result.title }}</span>
					<span
						class="autocomplete-type"
						:class="getTypeColor(result._type)"
					>{{ getTypeLabel(result._type) }}</span
					>
				</button>
			</div>

			<!-- No Results -->
			<div v-else-if="!isLoading" class="no-results">
				<p>No results found for "{{ searchQuery }}"</p>
				<span>Try searching for shows, people, venues, or articles</span>
			</div>
		</div>

		<!-- Keyboard Hints (for modal) -->
		<div v-if="isModal && !hasQuery" class="keyboard-hints">
			<div class="hint">
				<kbd>↑</kbd><kbd>↓</kbd>
				<span>to navigate</span>
			</div>
			<div class="hint">
				<kbd>↵</kbd>
				<span>to select</span>
			</div>
			<div class="hint">
				<kbd>esc</kbd>
				<span>to close</span>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.site-search {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border: 0.0935rem solid var(--color-text);

  &.is-modal {
    background: var(--color-bg);
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--small-padding);
  padding: var(--base-padding);
  position: relative;

  .search-icon {
    color: var(--color-text-light, #888);
    display: flex;
    align-items: center;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1.125rem;
    color: var(--color-text);
    outline: none;
    font-family: var(--font-text);

    &::placeholder {
      color: var(--color-text-light, #888);
    }
  }

  .clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: transparent;
    border: none;
    color: var(--color-text-light, #888);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s ease;

    &:hover {
      color: var(--color-text);
      background: rgba(0, 0, 0, 0.05);
    }
  }

  .loading-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
    border-top-color: var(--color-text);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.search-results {
  max-height: 450px;
  overflow-y: auto;
}

.detailed-search-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--base-padding) calc(var(--base-padding) + var(--big-padding));
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  border: none;
  border-bottom: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--font-text-semibold);
  
  .link-text {
    font-size: var(--small-font-size);
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
  }
  
  svg {
    color: var(--color-text-light, #888);
    flex-shrink: 0;
    transition: all 0.15s ease;
  }
  
  &:hover {
    background: color-mix(in srgb, var(--color-text) 10%, transparent);
    
    svg {
      color: var(--color-text);
      transform: translateX(4px);
    }
  }
}

.results-list {
  padding: var(--small-padding);
  max-height: 350px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-text-light, rgba(0, 0, 0, 0.2)) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-text-light, rgba(0, 0, 0, 0.2));
    border-radius: 3px;
    
    &:hover {
      background-color: var(--color-text-light, rgba(0, 0, 0, 0.3));
    }
  }
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: var(--small-padding);
  width: 100%;
  padding: var(--small-padding) var(--big-padding);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  border-radius: 8px; /* Added for better hover look in list */

  &:hover,
  &.is-selected {
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
  }

  .autocomplete-title {
    flex: 1;
    font-size: 0.9375rem; /* Matched from previous result-title */
    font-family: var(--font-text-semibold);
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .autocomplete-type {
    font-size: var(--small-font-size);
    font-family: var(--font-text-semibold);
    color: var(--color-text-light, #888);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    padding: var(--small-padding) var(--base-padding);
    background-color: var(--color-bg);
    border-radius: 100px;
    border: 0.09325rem solid var(--color-text);
    white-space: nowrap; /* Prevent wrapping */

    &.type-shows {
      border-color: var(--color-pink);
      color: var(--color-pink);
      /* Removed hover effect as it is inside a button */
    }

    &.type-pool {
      border-color: var(--color-blue);
      color: var(--color-blue);
    }

    &.type-words {
      border-color: var(--color-green);
      color: var(--color-green);
    }

    &.type-tag {
      border-color: var(--color-text);
      color: var(--color-text);
    }
  }
}

.no-results {
  padding: var(--big-padding);
  text-align: center;
  color: var(--color-text-light, #888);

  p {
    font-size: 0.9375rem;
    font-weight: 500;
    margin-bottom: var(--small-padding);
    color: var(--color-text);
  }

  span {
    font-size: 0.8125rem;
  }
}

.keyboard-hints {
  display: flex;
  justify-content: center;
  gap: var(--big-padding);
  padding: var(--base-padding);
  border-top: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
  background: rgba(0, 0, 0, 0.02);

  .hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--color-text-light, #888);

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      background: var(--color-bg);
      border: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.15));
      border-radius: 4px;
      font-size: 0.6875rem;
      font-family: var(--font-text);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .site-search.is-modal {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .autocomplete-item {
    &:hover,
    &.is-selected {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  .keyboard-hints {
    background: rgba(255, 255, 255, 0.02);
  }

  .clear-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
