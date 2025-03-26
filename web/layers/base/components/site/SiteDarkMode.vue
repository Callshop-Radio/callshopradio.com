
<template>
  <div class="darkmodeswitch" @click="toggleDarkMode">
    <svg
      width="24"
      height="15"
      viewBox="0 0 18 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle class="left" cx="5.5" cy="5.5" r="5.5" fill="var(--color-text)" />
      <circle
        class="right"
        cx="12.5"
        cy="5.5"
        r="5"
        fill="var(--color-bg)"
        stroke="var(--color-text)"
      />
    </svg>
  </div>
</template>
          
          <script setup>
import { computed } from "vue";
import { useMainStore } from "@/stores/mainStore";

const mainStore = useMainStore();
const isDarkMode = computed(() => mainStore?.isDarkMode);

const toggleDarkMode = () => {
  mainStore.toggleDarkMode();
};
</script>
          
<style scoped lang="postcss">
.darkmodeswitch {
  display: inline-flex;
  flex-flow: column wrap;
  justify-content: center;
  align-items: flex-start;
  cursor: pointer;

  svg,
  path {
    fill: var(--color-text);
  }
  svg {
    &.active {
      transform: rotate(180deg);
    }
  }
  &:hover {
    fill: var(--color-pink);
    circle {
      &.left {
        fill: var(--color-pink);
      }
      &.right {
        stroke: var(--color-pink);
      }
    }
    path {
      fill: var(--color-bg);
    }
  }
}
</style>
          