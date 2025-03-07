<script setup>
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu);
</script>

<template>
  <nav class="menu">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="11.5" shape-rendering="geometricPrecision"/>
      <path d="M5 8.5H19" stroke-linecap="round" shape-rendering="optimizeQuality"/>
      <path d="M5 12H19" stroke-linecap="round" shape-rendering="optimizeQuality"/>
      <path d="M5 15.5H19" stroke-linecap="round" shape-rendering="optimizeQuality"/>
    </svg>

    <ElementsLink
      v-for="item in mainMenu"
      :key="item?._key"
      :type="item?.type"
      :href="item?.url"
      :blank="item?.blank"
      :route="item?.route"
      :slug="item?.slug"
      :func="item?.func"
    >
      {{ item?.title }}
    </ElementsLink>
  </nav>
</template>

<style lang="postcss" scoped>
nav {
  @apply flex gap-4 p4 sticky top-0 z-99;
  svg {
    overflow: visible;

    circle,
    path {
      stroke: var(--color-text);
      overflow: visible;
    }
  }
}
</style>
