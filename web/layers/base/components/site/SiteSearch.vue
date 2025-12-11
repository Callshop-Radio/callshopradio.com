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
} = useSearch({ maxResults: 5, debounceMs: 300 });

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
          results.value.length - 1
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
          <circle cx="11" cy="11" r="8" />
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
      />
      <button
        v-if="hasQuery"
        class="clear-button"
        @click="clearSearch"
        aria-label="Clear search"
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
      <div v-if="hasResults" class="results-list">
        <button
          v-for="(result, index) in results"
          :key="result._id"
          class="result-item"
          :class="{
            'is-active': index === activeIndex,
            [getTypeColor(result._type)]: true,
          }"
          @click="navigateToResult(result)"
          @mouseenter="activeIndex = index"
        >
          <div class="result-content">
            <span class="result-type-badge" :class="getTypeColor(result._type)">
              {{ getTypeLabel(result._type) }}
            </span>
            <span class="result-title">{{ result.title }}</span>
            <span v-if="result.additionalTitle" class="result-subtitle">
              {{ result.additionalTitle }}
            </span>
          </div>
          <svg
            class="result-arrow"
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
  border-bottom: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.1));
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
  max-height: 400px;
  overflow-y: auto;
}

.results-list {
  padding: var(--small-padding);
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--base-padding);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  font-family: var(--font-text);

  &:hover,
  &.is-active {
    background: rgba(0, 0, 0, 0.04);
  }

  &.type-pool.is-active,
  &.type-pool:hover {
    background: color-mix(in srgb, var(--color-blue) 10%, transparent);
  }

  &.type-shows.is-active,
  &.type-shows:hover {
    background: color-mix(in srgb, var(--color-pink) 10%, transparent);
  }

  &.type-words.is-active,
  &.type-words:hover {
    background: color-mix(in srgb, var(--color-green) 10%, transparent);
  }

  .result-content {
    display: flex;
    align-items: center;
    gap: var(--small-padding);
    flex: 1;
    overflow: hidden;
  }

  .result-type-badge {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 8px;
    border-radius: 4px;
    flex-shrink: 0;
    background: var(--color-text);
    color: var(--color-bg);

    &.type-pool {
      background: var(--color-blue);
    }

    &.type-shows {
      background: var(--color-pink);
    }

    &.type-words {
      background: var(--color-green);
    }
  }

  .result-title {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-subtitle {
    font-size: 0.8125rem;
    color: var(--color-text-light, #888);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &::before {
      content: "·";
      margin-right: var(--small-padding);
    }
  }

  .result-arrow {
    color: var(--color-text-light, #888);
    flex-shrink: 0;
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.15s ease;
  }

  &:hover .result-arrow,
  &.is-active .result-arrow {
    opacity: 1;
    transform: translateX(0);
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

  .result-item {
    &:hover,
    &.is-active {
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
