<script setup>
const isSearchOpen = ref(false);

const openSearch = () => {
  isSearchOpen.value = true;
};

// Keyboard shortcut (Cmd/Ctrl + K) to open search
const handleKeydown = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    openSearch();
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
  <div class="site-search-button-wrapper">
    <button
      class="search-button"
      @click="openSearch"
      aria-label="Open search"
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
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span class="button-text">Search</span>
      <span class="keyboard-shortcut">
        <kbd>⌘</kbd><kbd>K</kbd>
      </span>
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
  background: transparent;
  border: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.2));
  border-radius: 100px;
  font-size: 0.875rem;
  font-family: var(--font-text);
  color: var(--color-text-light, #888);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--color-text);
    color: var(--color-text);
    background: rgba(0, 0, 0, 0.02);
  }

  .button-text {
    @media (max-width: 768px) {
      display: none;
    }
  }

  .keyboard-shortcut {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: 4px;

    @media (max-width: 900px) {
      display: none;
    }

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: var(--color-bg);
      border: 1px solid var(--color-text-light, rgba(0, 0, 0, 0.15));
      border-radius: 4px;
      font-size: 0.625rem;
      font-family: var(--font-text);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .search-button:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}
</style>
