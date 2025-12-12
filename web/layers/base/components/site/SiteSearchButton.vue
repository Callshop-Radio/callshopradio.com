<script setup>
const route = useRoute();
const isSearchOpen = ref(false);

// Check if we are on the search page
const isOnSearchPage = computed(() => {
  return route.path.includes('/search');
});

// Button is active when modal is open or on search page
const isActive = computed(() => {
  return isSearchOpen.value || isOnSearchPage.value;
});

const openSearch = () => {
  // Don't open modal if already on search page
  if (isOnSearchPage.value) return;
  isSearchOpen.value = true;
};

// Keyboard shortcut (Cmd/Ctrl + K) to open search
const handleKeydown = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    // Don't open modal if already on search page
    if (!isOnSearchPage.value) {
      openSearch();
    }
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="site-search-button-wrapper tags">
    <button
      class="search-button tag"
      :class="{ 'is-active': isActive, 'is-disabled': isOnSearchPage }"
      :disabled="isOnSearchPage"
      @click="openSearch"
      aria-label="Open search"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
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

    <SiteSearchModal v-model="isSearchOpen" />
  </div>
</template>

<style lang="postcss" scoped>
.site-search-button-wrapper {
  display: flex;
  align-items: center;
}

.search-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--color-bg);
  border: 1px solid var(--color-text, rgba(0, 0, 0, 0.2));
  border-radius: 100px;
  font-size: 0.875rem;
  font-family: var(--font-text-semibold);
  padding: calc(var(--small-padding)) var(--base-padding);
  font-size: var(--small-font-size);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(.is-disabled),
  &.is-active {
    border-color: var(--color-text);
    color: var(--color-bg);
    background-color: var(--color-text);
    svg {
      path {
        fill: var(--color-bg);
      }
      circle {
        stroke: var(--color-bg);
      }
    }
  }

  &.is-disabled {
    cursor: default;
    opacity: 1;
  }

  .button-text {
    @media (max-width: 768px) {
      display: none;
    }
  }

  svg {
    path {
      fill: var(--color-text);
    }
    circle {
      stroke: var(--color-text);
    }
  }
}
</style>

