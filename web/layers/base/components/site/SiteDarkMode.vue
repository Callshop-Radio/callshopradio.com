<script setup>
import { computed } from "vue";
import { useMainStore } from "@/stores/mainStore";

const mainStore = useMainStore();
const isDark = computed(() => Boolean(mainStore?.isDarkMode));

onMounted(() => {
	mainStore.detectSystemDarkMode();
});

function toggleDarkMode() {
	mainStore.toggleDarkMode();
}
</script>

<template>
	<button
		type="button"
		class="theme-switch"
		role="switch"
		:aria-checked="isDark"
		aria-label="Light and dark mode"
		@click="toggleDarkMode"
	>
		<span class="theme-switch__thumb" />
	</button>
</template>

<style scoped lang="postcss">
.theme-switch {
  position: relative;
  display: inline-flex;
  flex: none;
  width: 2.75rem;
  height: 1.5rem;
  padding: 0;
  border: 1px solid var(--color-text);
  border-radius: var(--radius-circle);
  background-color: var(--color-bg);
  cursor: pointer;
  transition:
    background-color 220ms ease,
    border-color 220ms ease;

  &__thumb {
    position: absolute;
    top: 50%;
    left: 0.125rem;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 50%;
    background-color: var(--color-text);
    transform: translate(0, -50%);
    transition:
      transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
      background-color 220ms ease;
  }

  &[aria-checked="true"] {
    background-color: var(--color-text);

    .theme-switch__thumb {
      background-color: var(--color-bg);
      transform: translate(1.25rem, -50%);
    }
  }

  &:hover {
    @media (min-width: 1024px) {
      border-color: var(--color-pink);

      .theme-switch__thumb {
        background-color: var(--color-pink);
      }

      &[aria-checked="true"] {
        background-color: var(--color-pink);

        .theme-switch__thumb {
          background-color: var(--color-bg);
        }
      }
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-switch,
  .theme-switch__thumb {
    transition: none;
  }
}
</style>
